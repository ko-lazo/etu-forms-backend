import { JOB_STATUS, type Job, type JobStatus } from "./job.types.js";

const TERMINAL_STATUSES: readonly JobStatus[] = [
  JOB_STATUS.SUCCEEDED,
  JOB_STATUS.FAILED,
  JOB_STATUS.CANCELLED,
];

/**
 * Финальный статус, задача больше не меняется
 */
export function isTerminal(status: JobStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Подсчёт процента готовности.
 * @remarks Задача не получит явные 100 процентов до фактического завершения
 */
export function computeProgress(job: Job): number | null {
  if (job.status === JOB_STATUS.SUCCEEDED) return 100;
  if (!job.totalCount) return null;

  return Math.min(99, Math.floor((job.processedCount / job.totalCount) * 100));
}
