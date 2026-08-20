import { randomUUID } from "node:crypto";
import { finished } from "node:stream/promises";

import {
  JobFatalError,
  type JobResultFile,
  type JobContext,
  type JobHandler,
  type JobResult,
} from "@/modules/job/index.js";
import type { IFileStorage } from "@/core/storage/file-storage.interface.js";
import type { Form, FormService } from "@/modules/form/index.js";

import type { FormResponseRepository } from "../db/form-response.repository.js";
import {
  buildFileName,
  collectColumns,
  writeWorkbook,
  XLSX_MIME,
} from "./export.formatter.js";
import {
  EXPORT_JOB_TYPE,
  exportPayloadSchema,
  type ExportFileKeys,
  type ExportPayload,
} from "./export.types.js";

export const MAX_EXPORT_ROWS = 500_000;

/**
 * Выгрузка ответов формы в XLSX-файл.
 * Читает строки из базы пачками и пишет в .xlsx.
 * Результат сохраняет во временный файл, затем перемещает в хранилище.
 */
export class ExportJob implements JobHandler<ExportPayload> {
  public readonly type = EXPORT_JOB_TYPE;
  public readonly payloadSchema = exportPayloadSchema;

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
    payload: ExportPayload,
    context: JobContext,
  ): Promise<JobResult> {
    context.signal.throwIfAborted();

    const form = await this.formService.findById(payload.formId);

    if (!form) {
      throw new JobFatalError(
        "FORM_NOT_FOUND",
        `Form ${payload.formId} not found`,
      );
    }

    const total = await this.responseRepository.countByFormId(form.id);

    // todo поддержка крупных экспортов (сделать через csv)
    if (total > MAX_EXPORT_ROWS) {
      throw new JobFatalError(
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

    const file: JobResultFile = {
      key: keys.final,
      name: buildFileName(),
      size: stored.size,
      mimeType: XLSX_MIME,
    };

    return { file, rowCount };
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
