import { randomUUID } from "node:crypto";
import { Writable } from "node:stream";
import { finished, pipeline } from "node:stream/promises";
import { z } from "zod";
import ExcelJS from "exceljs";

import {
  PermanentJobError,
  type JobArtifact,
  type JobContext,
  type JobHandler,
  type JobResult,
} from "@/modules/job/index.js";
import type { IFileStorage } from "@/core/storage/file-storage.interface.js";
import type { FormService } from "@/modules/form/form.service.js";
import type { Form } from "@/modules/form/form.types.js";
import type { FormSchemaDto } from "@/modules/form/schema/form-schema.schema.js";

import type { FormResponseRepository } from "../form-response.repository.js";
import type { FormResponseExportRow } from "@/modules/form-response/form-response.types.js";

export const EXPORT_RESPONSES_JOB_TYPE = "form-responses.export";

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const MAX_EXPORT_ROWS = 500_000;

export const exportResponsesPayloadSchema = z.object({
  formId: z.uuid(),
});

export type ExportResponsesPayload = z.infer<
  typeof exportResponsesPayloadSchema
>;

type ExportColumn = {
  readonly name: string;
  readonly label: string;
};

/** Куда пишем заготовку и куда публикуем готовый файл */
type ExportFileKeys = {
  readonly temporary: string;
  readonly final: string;
};

type WriteWorkbookOptions = {
  /** Куда пишем заготовку. `commit()` завершает этот поток */
  readonly output: Writable;

  /** Откуда берём строки для записи в файл */
  readonly rows: AsyncIterable<FormResponseExportRow>;

  /** Колонки ответов */
  readonly columns: readonly ExportColumn[];

  readonly signal: AbortSignal;

  /** Вызывается после каждой строки с их накопленным числом */
  readonly onProgress: (processed: number) => void;
};

/**
 * Воркер для выгрузки ответов формы в Excel.
 * Построчно стримит данные из БД и сразу пишет в .xlsx.
 * Результат сохраняет во временный файл, затем перемещает в хранилище.
 */
export class ExportResponsesHandler implements JobHandler<ExportResponsesPayload> {
  public readonly type = EXPORT_RESPONSES_JOB_TYPE;
  public readonly payloadSchema = exportResponsesPayloadSchema;

  constructor(
    private readonly formService: FormService,
    private readonly responseRepository: FormResponseRepository,
    private readonly storage: IFileStorage,
  ) {}

  /**
   * Запускает процесс экспорта: проверяет форму, создает стрим в хранилище,
   * формирует Excel и обновляет прогресс задачи
   */
  public async handle(
    payload: ExportResponsesPayload,
    context: JobContext,
  ): Promise<JobResult> {
    context.signal.throwIfAborted();

    const form = await this.formService.findById(payload.formId);

    if (!form) {
      throw new PermanentJobError(
        "FORM_NOT_FOUND",
        `Form ${payload.formId} not found`,
      );
    }

    const total = await this.responseRepository.countByFormId(form.id);

    // todo поддержка крупных экспортов (сделать через csv)
    if (total > MAX_EXPORT_ROWS) {
      throw new PermanentJobError(
          "EXPORT_TOO_LARGE",
          `Large exports are not supported yet: ${total} rows`,
      );
    }

    context.reportProgress(0, total);

    const keys: ExportFileKeys = {
      temporary: `tmp/${context.job.id}-${randomUUID()}.xlsx`,
      final: `exports/${form.userId}/${context.job.id}.xlsx`,
    };

    const rowCount = await this.writeExportFile(form, keys, context);

    const stored = await this.storage.stat(keys.final);

    if (!stored) {
      throw new Error(`Export file ${keys.final} not found`);
    }

    const artifact: JobArtifact = {
      key: keys.final,
      name: buildFileName(form.title),
      size: stored.size,
      mimeType: XLSX_MIME,
    };

    return { artifact, rowCount };
  }

  /**
   * Пишет результат во временный файл и публикует его
   * @returns Число выгруженных строк
   */
  private async writeExportFile(
    form: Form,
    keys: ExportFileKeys,
    context: JobContext,
  ): Promise<number> {
    const columns = collectColumns(form.schema);
    const output = await this.storage.createWriteStream(keys.temporary);

    try {
      const rowCount = await writeWorkbook({
        output,
        rows: this.responseRepository.streamByFormId(form.id),
        columns,
        signal: context.signal,
        onProgress: (processed) => context.reportProgress(processed),
      });

      await finished(output);
      await this.storage.move(keys.temporary, keys.final);

      return rowCount;
    } catch (error) {
      output.destroy();
      await finished(output).catch(() => undefined);
      await this.storage.delete(keys.temporary).catch(() => undefined);
      throw error;
    }
  }
}

/**
 * Наполняет XLSX workbook строками
 * @returns число записанных строк
 */
async function writeWorkbook({
  output,
  rows,
  columns,
  signal,
  onProgress,
}: WriteWorkbookOptions): Promise<number> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: output,
    useStyles: false,
    useSharedStrings: false,
  });

  const sheet = workbook.addWorksheet("Ответы");

  sheet.columns = [
    { header: "ID", width: 38 },
    { header: "Создан", width: 22 },
    { header: "Отправлен", width: 22 },
    ...columns.map((column) => ({ header: column.label, width: 28 })),
  ];

  let processed = 0;

  const writer = new Writable({
    objectMode: true,
    write: (row: FormResponseExportRow, _encoding, callback) => {
      try {
        sheet.addRow(toRowValues(row, columns)).commit();

        processed += 1;
        onProgress(processed);

        callback();
      } catch (error) {
        callback(error as Error);
      }
    },
  });

  await pipeline(rows, writer, { signal });

  await workbook.commit();

  return processed;
}

/**
 * Собирает список колонок для Excel из JSON-схемы формы
 */
function collectColumns(schema: FormSchemaDto): ExportColumn[] {
  return schema.pages.flatMap((page) =>
    page.elements.map((element) => ({
      name: element.name,
      label: element.label,
    })),
  );
}

/**
 * Превращает сырую строку ответа на форму из БД в массив значений для вставки в Excel
 */
function toRowValues(
  row: FormResponseExportRow,
  columns: readonly ExportColumn[],
): unknown[] {
  return [
    row.id,
    row.createdAt,
    row.submittedAt,
    ...columns.map((column) => formatAnswer(row.answers[column.name])),
  ];
}

/**
 * Приводит разные типы ответов к плоскому виду
 */
function formatAnswer(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) return value.join(", ");

  if (typeof value === "object") return JSON.stringify(value);

  return value as string | number | boolean;
}

/**
 * Формирует имя файла
 */
function buildFileName(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 80);

  return `${safeTitle || "form"}-${date}.xlsx`;
}
