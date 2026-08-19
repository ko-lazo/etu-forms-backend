import {
  JOB_STATUS,
  type Job,
  type JobResultFile,
  type JobResult,
  type JobStatus,
} from "./job.types.js";

const FINAL_STATUSES: readonly JobStatus[] = [
  JOB_STATUS.SUCCEEDED,
  JOB_STATUS.FAILED,
  JOB_STATUS.CANCELLED,
];

/**
 * Финальный статус, задача больше не поменяется
 */
export function isFinished(status: JobStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

/**
 * Подсчёт процента готовности.
 * @remarks Задача не получит 100 процентов до фактического завершения
 */
export function computeProgress(job: Job): number | null {
  if (job.status === JOB_STATUS.SUCCEEDED) return 100;
  if (!job.totalCount) return null;

  return Math.min(99, Math.floor((job.processedCount / job.totalCount) * 100));
}

/**
 * Достаёт результирующий файл из результата операции.
 */
export function readResultFile(result: JobResult | null): JobResultFile | null {
  if (!result) return null;

  const file = result["file"];

  if (typeof file !== "object" || file === null) return null;

  const { key, name, size, mimeType } = file as Record<string, unknown>;

  if (
    typeof key !== "string" ||
    typeof name !== "string" ||
    typeof size !== "number" ||
    typeof mimeType !== "string"
  ) {
    return null;
  }

  return { key, name, size, mimeType };
}
