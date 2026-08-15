import {
  JOB_STATUS,
  type Job,
  type JobArtifact,
  type JobResult,
  type JobStatus,
} from "./job.types.js";

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

/**
 * Достаёт артефакт из результата операции.
 * @remarks `result` приходит из JSONB, поэтому его форма не гарантирована типами
 */
export function readArtifact(result: JobResult | null): JobArtifact | null {
  if (!result) return null;

  const artifact = result["artifact"];

  if (typeof artifact !== "object" || artifact === null) return null;

  const { key, name, size, mimeType } = artifact as Record<string, unknown>;

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
