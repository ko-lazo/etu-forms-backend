export const JOB_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const JOB_STATUSES = Object.values(JOB_STATUS) as [
  JobStatus,
  ...JobStatus[],
];

export const JOB_TYPES = {
  formResponsesExport: "form-responses.export",
  formImport: "form.import",
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export type JobPayload = Record<string, unknown>;

export type JobResult = Record<string, unknown>;

/**
 * Файл-результат задачи
 * @remarks `key` - внутренний ключ хранилища
 */
export type JobArtifact = {
  readonly key: string;
  readonly name: string;
  readonly size: number;
  readonly mimeType: string;
};

export type JobError = {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
};

export interface Job {
  readonly id: string;
  readonly type: JobType;
  readonly status: JobStatus;
  readonly userId: string | null;

  readonly payload: JobPayload;
  readonly result: JobResult | null;
  readonly error: JobError | null;

  readonly idempotencyKey: string | null;

  readonly processedCount: number;
  readonly totalCount: number | null;

  readonly cancelRequestedAt: Date | null;
  readonly startedAt: Date | null;
  readonly finishedAt: Date | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type JobCreate = {
  readonly type: JobType;
  readonly userId: string | null;
  readonly payload: JobPayload;
  readonly idempotencyKey?: string | null;
};

export type JobUpdate = {
  readonly status?: JobStatus;
  readonly processedCount?: number;
  readonly totalCount?: number | null;
  readonly result?: JobResult | null;
  readonly error?: JobError | null;
};
