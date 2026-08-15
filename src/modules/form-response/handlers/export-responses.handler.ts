import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { z } from "zod";
import ExcelJS from "exceljs";

import {
  PermanentJobError,
  type JobContext,
  type JobHandler,
  type JobResult,
} from "@/modules/job/index.js";
import type { IFileStorage } from "@/core/storage/file-storage.interface.js";
import type { FormRepository } from "@/modules/form/form.repository.js";
import type { FormSchemaDto } from "@/modules/form/schema/form-schema.schema.js";

import type {
  FormResponseRepository,
} from "../form-response.repository.js";

export const EXPORT_RESPONSES_JOB_TYPE = "form-responses.export";

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const exportResponsesPayloadSchema = z.object({
  formId: z.uuid(),
});

export type ExportResponsesPayload = z.infer<
  typeof exportResponsesPayloadSchema
>;

export type ExportedResponseRow = {
  readonly id: string;
  readonly answers: Record<string, unknown>;
  readonly createdAt: Date;
  readonly submittedAt: Date | null;
};

type ExportColumn = {
  readonly name: string;
  readonly label: string;
};

/**
 * todo refactor отделить код джобы от формирования xlsx?
 * Воркер для выгрузки ответов формы в Excel.
 * Построчно стримит данные из БД и сразу пишет в .xlsx.
 * Результат сохраняет во временный файл, затем перемещает в хранилище.
 */
export class ExportResponsesHandler implements JobHandler<ExportResponsesPayload> {
  public readonly type = EXPORT_RESPONSES_JOB_TYPE;
  public readonly payloadSchema = exportResponsesPayloadSchema;

  constructor(
    private readonly formRepository: FormRepository,
    private readonly responseRepository: FormResponseRepository,
    private readonly storage: IFileStorage,
  ) {}

  /**
   * todo refactor (JobResult не является четким типам,
   *   при этом реальный return { ...JobArtifact, ... })
   * Запускает процесс экспорта: проверяет форму, создает стрим в хранилище,
   * формирует Excel и обновляет прогресс задачи
   */
  public async handle(
    payload: ExportResponsesPayload,
    context: JobContext,
  ): Promise<JobResult> {
    context.signal.throwIfAborted();

    const form = await this.formRepository.findById(payload.formId);

    if (!form) {
      throw new PermanentJobError(
        "FORM_NOT_FOUND",
        `Форма ${payload.formId} не найдена`,
      );
    }

    const total = await this.responseRepository.countByFormId(form.id);
    context.reportProgress(0, total);

    const columns = collectColumns(form.schema);

    const temporaryKey = `tmp/${context.job.id}-${randomUUID()}.xlsx`;
    const finalKey = `exports/${form.userId}/${context.job.id}.xlsx`;

    let processed = 0;

    const output = await this.storage.createWriteStream(temporaryKey);

    try {
      const closed = once(output, "close");

      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: output,
        useStyles: false,
        useSharedStrings: false,
      });

      const sheet = workbook.addWorksheet("Ответы");

      // todo рефактор (хардкод)
      sheet.columns = [
        { header: "ID", width: 38 },
        { header: "Создан", width: 22 },
        { header: "Отправлен", width: 22 },
        ...columns.map((column) => ({ header: column.label, width: 28 })),
      ];

      // todo refactor (вынести в функцию)
      await this.responseRepository.streamByFormId(form.id, async (rows) => {
        const writer = new Writable({
          objectMode: true,
          write: (row: ExportedResponseRow, _encoding, callback) => {
            try {
              sheet.addRow(toRowValues(row, columns)).commit();

              processed += 1;
              context.reportProgress(processed);

              callback();
            } catch (error) {
              callback(error as Error);
            }
          },
        });

        await pipeline(rows, writer, { signal: context.signal });
      });

      sheet.commit();
      await workbook.commit();
      await closed;
    } catch (error) {
      output.destroy();
      await this.storage.delete(temporaryKey).catch(() => undefined);
      throw error;
    }

    await this.storage.move(temporaryKey, finalKey);

    const stored = await this.storage.stat(finalKey);

    return {
      artifact: {
        key: finalKey,
        name: buildFileName(form.title),
        size: stored?.size ?? 0,
        mimeType: XLSX_MIME,
      },
      rowCount: processed,
    };
  }
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
  row: ExportedResponseRow,
  columns: ExportColumn[],
): unknown[] {
  return [
    row.id,
    row.createdAt,
    row.submittedAt,
    ...columns.map((column) => formatAnswer(row.answers[column.name])),
  ];
}

/**
 * todo form-response.domain?
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
