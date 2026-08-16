import { type RepositoryMetadata } from "@/core/repositories/repository.metadata.js";
import { type Job, type JobCreate, type JobUpdate } from "../job.types.js";

export const jobMetadata = {
  tableName: "jobs",

  primaryKey: "id",

  defaultOrder: {
    column: "createdAt",
    direction: "DESC",
  },

  columns: {
    id: "id",
    type: "type",
    status: "status",
    userId: "user_id",
    payload: "payload",
    result: "result",
    error: "error",
    idempotencyKey: "idempotency_key",
    processedCount: "processed_count",
    totalCount: "total_count",
    cancelRequestedAt: "cancel_requested_at",
    startedAt: "started_at",
    finishedAt: "finished_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },

  creatableColumns: ["type", "userId", "payload", "idempotencyKey"],

  updatableColumns: [
    "status",
    "processedCount",
    "totalCount",
    "result",
    "error",
  ],

  jsonColumns: ["payload", "result", "error"],
} satisfies RepositoryMetadata<Job, JobCreate, JobUpdate>;
