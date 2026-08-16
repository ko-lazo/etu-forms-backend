import type { Writable } from "node:stream";
import { z } from "zod";

/** Значение попадает в `jobs.type` и в idempotency-key */
export const EXPORT_JOB_TYPE = "form-responses.export";

export const exportPayloadSchema = z.object({
  formId: z.uuid(),
});

export type ExportPayload = z.infer<typeof exportPayloadSchema>;

/** Строка ответа в том виде, в котором её читает экспорт */
export type ExportedResponseRow = {
  readonly id: string;
  readonly answers: Record<string, unknown>;
  readonly createdAt: Date;
  readonly submittedAt: Date | null;
};

export type ExportColumn = {
  readonly name: string;
  readonly label: string;
};

/** Куда пишем заготовку и куда публикуем готовый файл */
export type ExportFileKeys = {
  readonly temporary: string;
  readonly final: string;
};

export type WriteWorkbookOptions = {
  /** Куда пишем заготовку. `commit()` завершает этот поток */
  readonly output: Writable;

  /** Откуда берём строки для записи в файл */
  readonly rows: AsyncIterable<ExportedResponseRow>;

  /** Колонки ответов */
  readonly columns: readonly ExportColumn[];

  readonly signal: AbortSignal;

  /** Вызывается после каждой строки с их накопленным числом */
  readonly onProgress: (processed: number) => void;
};
