import { randomUUID } from "node:crypto";
import { finished } from "node:stream/promises";
import { z } from "zod";

import {
  PermanentJobError,
  type JobArtifact,
  type JobContext,
  type JobHandler,
  type JobResult,
} from "@/modules/job/index.js";
import type { IFileStorage } from "@/core/storage/file-storage.interface.js";
import type { FormService } from "@/modules/form/form.service.js";

import type { FormResponseRepository } from "../form-response.repository.js";
import {
  collectColumns,
  SERVICE_COLUMNS,
} from "../export/export-row.formatter.js";
import { EXPORT_FORMATS, FORMAT_SPECS } from "../export/export.formats.js";
import type { ExportColumn, ExportWriter } from "../export/export.types.js";

export const EXPORT_RESPONSES_JOB_TYPE = "form-responses.export";

export const exportResponsesPayloadSchema = z.object({
  formId: z.uuid(),
  format: z.enum(EXPORT_FORMATS).default("xlsx"),
});

export type ExportResponsesPayload = z.infer<
  typeof exportResponsesPayloadSchema
>;

/** Куда пишем заготовку и куда публикуем готовый файл */
type ExportFileKeys = {
  readonly temporary: string;
  readonly final: string;
};

/**
 * Воркер для выгрузки ответов формы.
 * Построчно стримит данные из БД и сразу пишет в файл выбранного формата.
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
   * Запускает процесс экспорта: проверяет форму и её размер, пишет файл
   * и обновляет прогресс задачи
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

    const spec = FORMAT_SPECS[payload.format];
    const columns = collectColumns(form.schema);
    const total = await this.responseRepository.countByFormId(form.id);

    const cells = total * (columns.length + SERVICE_COLUMNS.length);

    if (cells > spec.maxCells) {
      throw new PermanentJobError(
        "EXPORT_TOO_LARGE",
        `Export of ${cells} cells exceeds the ${payload.format} limit of ${spec.maxCells}`,
        { cells, limit: spec.maxCells, format: payload.format },
      );
    }

    context.reportProgress(0, total);

    const keys: ExportFileKeys = {
      temporary: `tmp/${context.job.id}-${randomUUID()}.${spec.extension}`,
      final: `exports/${form.userId}/${context.job.id}.${spec.extension}`,
    };

    const rowCount = await this.writeExportFile({
      formId: form.id,
      keys,
      columns,
      write: spec.write,
      context,
    });

    const stored = await this.storage.stat(keys.final);

    if (!stored) {
      throw new Error(`Export file ${keys.final} not found`);
    }

    const artifact: JobArtifact = {
      key: keys.final,
      name: buildFileName(form.title, spec.extension),
      size: stored.size,
      mimeType: spec.mime,
    };

    return { artifact, rowCount };
  }

  /**
   * Пишет результат во временный файл и публикует его
   * @returns Число выгруженных строк
   */
  private async writeExportFile({
    formId,
    keys,
    columns,
    write,
    context,
  }: {
    formId: string;
    keys: ExportFileKeys;
    columns: readonly ExportColumn[];
    write: ExportWriter;
    context: JobContext;
  }): Promise<number> {
    const output = await this.storage.createWriteStream(keys.temporary);

    try {
      const rowCount = await write({
        output,
        rows: this.responseRepository.streamByFormId(formId),
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
 * Формирует имя файла
 */
function buildFileName(title: string, extension: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 80);

  return `${safeTitle || "form"}-${date}.${extension}`;
}
