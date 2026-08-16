import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parse } from "csv-parse";
import { z } from "zod";

import type { DatabaseClient } from "@/core/database/database.client.js";
import type { IFileStorage } from "@/core/storage/file-storage.interface.js";
import {
  PermanentJobError,
  type IJobResultWriter,
  type JobContext,
  type JobHandler,
  type JobResult,
} from "@/modules/job/index.js";
import type { FormRepository } from "@/modules/form/form.repository.js";

import {
  csvRowToElement,
  findDuplicateNames,
  normalizeRow,
  type CsvRowError,
  type ParsedElement,
} from "../import/csv-form.parser.js";

export const IMPORT_FORM_JOB_TYPE = "form.import";

export const importFormPayloadSchema = z.object({
  fileKey: z.string().min(1),
  title: z.string().trim().min(1).max(500),
});

export type ImportFormPayload = z.infer<typeof importFormPayloadSchema>;

const MAX_COLLECTED_ERRORS = 50;

/**
 * Создаёт форму из CSV: одна строка файла — один вопрос
 */
export class ImportFormHandler implements JobHandler<ImportFormPayload> {
  public readonly type = IMPORT_FORM_JOB_TYPE;
  public readonly payloadSchema = importFormPayloadSchema;

  constructor(
    private readonly storage: IFileStorage,
    private readonly db: DatabaseClient,
    private readonly jobResultWriter: IJobResultWriter,
    private readonly formRepositoryFactory: (
      db: DatabaseClient,
    ) => FormRepository,
  ) {}

  public async handle(
    payload: ImportFormPayload,
    context: JobContext,
  ): Promise<JobResult> {
    context.signal.throwIfAborted();

    const userId = context.job.userId;

    if (!userId) {
      throw new PermanentJobError(
        "MISSING_OWNER",
        "У задачи импорта не указан владелец",
      );
    }

    const alreadyCreated = context.job.result?.["formId"];

    if (typeof alreadyCreated === "string") {
      context.logger.info(
        {
          formId: alreadyCreated,
        },
        "Форма уже создана предыдущей попыткой",
      );

      return context.job.result as JobResult;
    }

    const { elements, errors, truncated } = await this.readElements(
      payload,
      context,
    );

    if (errors.length > 0) {
      throw new PermanentJobError(
        "CSV_VALIDATION_FAILED",
        truncated
          ? `Файл содержит более ${MAX_COLLECTED_ERRORS} ошибочных строк`
          : `Файл содержит ошибки в ${errors.length} строк(ах)`,
        errors,
      );
    }

    if (elements.length === 0) {
      throw new PermanentJobError(
        "CSV_EMPTY",
        "В файле не найдено ни одного вопроса",
      );
    }

    const duplicates = findDuplicateNames(elements);

    if (duplicates.length > 0) {
      throw new PermanentJobError(
        "DUPLICATE_QUESTION_NAMES",
        "Имена вопросов должны быть уникальными",
        { duplicates },
      );
    }

    return this.db.withTransaction(async (tx) => {
      const form = await this.formRepositoryFactory(tx).create({
        userId,
        title: payload.title,
        schema: { pages: [{ name: "page1", elements }] },
        settings: {},
      });

      const result = { formId: form.id, elementsCount: elements.length };

      await this.jobResultWriter.saveResult(context.job.id, result, tx);

      return result;
    });
  }

  private async readElements(
    payload: ImportFormPayload,
    context: JobContext,
  ): Promise<{
    elements: ParsedElement[];
    errors: CsvRowError[];
    truncated: boolean;
  }> {
    const elements: ParsedElement[] = [];
    const errors: CsvRowError[] = [];
    let truncated = false;

    let line = 1;

    const parser = parse({
      columns: true,
      trim: true,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });

    const collector = new Writable({
      objectMode: true,
      write: (row: Record<string, string>, _encoding, callback) => {
        line += 1;

        const result = csvRowToElement(normalizeRow(row));

        if (result.ok) {
          elements.push(result.element);
        } else if (errors.length < MAX_COLLECTED_ERRORS) {
          errors.push({
            line,
            message: result.message,
            ...(result.details !== undefined
              ? { details: result.details }
              : {}),
          });
        } else {
          truncated = true;
        }

        context.reportProgress(line - 1);
        callback();
      },
    });

    try {
      await pipeline(
        this.storage.createReadStream(payload.fileKey),
        parser,
        collector,
        { signal: context.signal },
      );
    } catch (error) {
      if (isMissingFile(error)) {
        throw new PermanentJobError(
          "FILE_NOT_FOUND",
          `Файл ${payload.fileKey} не найден в хранилище`,
        );
      }

      if (isCsvFormatError(error)) {
        throw new PermanentJobError(
          "CSV_PARSE_FAILED",
          `Не удалось разобрать CSV: ${(error as Error).message}`,
        );
      }

      throw error;
    }

    return { elements, errors, truncated };
  }
}

function isMissingFile(error: unknown): boolean {
  return (
    error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function isCsvFormatError(error: unknown): boolean {
  return (
    error instanceof Error &&
    typeof (error as NodeJS.ErrnoException).code === "string" &&
    (error as NodeJS.ErrnoException).code!.startsWith("CSV_")
  );
}
