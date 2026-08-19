import type { Writable } from "node:stream";
import { z } from "zod";

/** Тип задачи, попадает в `jobs.type` и в idempotency-key */
export const EXPORT_JOB_TYPE = "form-responses.export";

export const exportPayloadSchema = z.object({
  formId: z.uuid(),
});

export type ExportPayload = z.infer<typeof exportPayloadSchema>;

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

/** Куда пишем временный файл и куда публикуем готовый файл */
export type ExportFileKeys = {
  readonly temporary: string;
  readonly final: string;
};

export type WriteWorkbookOptions = {
  /** Куда пишем временный файл, завершение уходит в `commit()` */
  readonly output: Writable;

  /** Откуда берём строки для записи в файл */
  readonly rows: AsyncIterable<ExportedResponseRow>;

  /** Колонки ответов на форму (для каждого ответа создается своя колонка) */
  readonly columns: readonly ExportColumn[];

  /** Сигнал прерывания записи файла */
  readonly signal: AbortSignal;

  /** Передаёт количество обработанных строк */
  readonly onProgress: (processed: number) => void;
};
