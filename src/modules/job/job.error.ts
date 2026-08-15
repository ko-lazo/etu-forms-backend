import type { JobError } from "./job.types.js";

/**
 * Критическая ошибка выполнения задачи, исключающая повторные попытки.
 * Конвертируется в `UnrecoverableError` для BullMQ.
 */
export class PermanentJobError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "PermanentJobError";
  }
}

export function toJobError(error: unknown): JobError {
  if (error instanceof PermanentJobError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    };
  }

  if (error instanceof Error) {
    return { code: "INTERNAL_ERROR", message: error.message };
  }

  return { code: "INTERNAL_ERROR", message: String(error) };
}
