import { BaseRepository } from "@/core/repositories/base.repository.js";
import { type DatabaseClient } from "@/core/database/database.client.js";
import { jobMetadata } from "./job.metadata.js";
import { JOB_STATUS } from "../job.types.js";
import type {
  Job,
  JobCreate,
  JobError,
  JobResult,
  JobUpdate,
} from "../job.types.js";

export type ProgressUpdate = {
  readonly processedCount: number;
  readonly totalCount?: number | null;
};

export class JobRepository extends BaseRepository<Job, JobCreate, JobUpdate> {
  constructor(db: DatabaseClient) {
    super(db, jobMetadata);
  }

  /**
   * Создаёт операцию или возвращает существующую по idempotency key.
   */
  async findOrCreate(data: JobCreate): Promise<Job> {
    const job = await this.db.queryOne<Job>(
      `INSERT INTO jobs (type, user_id, payload, idempotency_key)
             VALUES ($1, $2, $3::jsonb, $4)
             ON CONFLICT (idempotency_key) DO UPDATE SET idempotency_key = jobs.idempotency_key
             RETURNING *`,
      [
        data.type,
        data.userId,
        JSON.stringify(data.payload),
        data.idempotencyKey ?? null,
      ],
      this.metadata.columns,
    );

    if (!job) {
      throw new Error("Не удалось создать запись фоновой операции");
    }

    return job;
  }

  /**
   * Переводит операцию в состояние выполнения.
   * Возвращает null, если она уже завершена или отменена.
   */
  async start(id: string): Promise<Job | null> {
    return await this.db.queryOne<Job>(
      `UPDATE jobs
             SET status = $2,
                 started_at = COALESCE(started_at, NOW())
             WHERE id = $1 AND status IN ($3, $2)
             RETURNING *`,
      [id, JOB_STATUS.RUNNING, JOB_STATUS.PENDING],
      this.metadata.columns,
    );
  }

  /**
   * Завершает операцию успешно и сохраняет её результат и прогресс.
   */
  async succeed(
    id: string,
    result: JobResult,
    progress: ProgressUpdate,
  ): Promise<void> {
    await this.db.execute(
      `UPDATE jobs
             SET status = $2,
                 result = $3::jsonb,
                 processed_count = $4,
                 total_count = COALESCE($5::int, total_count),
                 finished_at = NOW()
             WHERE id = $1 AND status = $6`,
      [
        id,
        JOB_STATUS.SUCCEEDED,
        JSON.stringify(result),
        progress.processedCount,
        progress.totalCount ?? null,
        JOB_STATUS.RUNNING,
      ],
    );
  }

  /**
   * Завершает операцию с ошибкой.
   */
  async fail(id: string, error: JobError): Promise<void> {
    await this.db.execute(
      `UPDATE jobs
             SET status = $2,
                 error = $3::jsonb,
                 finished_at = NOW()
             WHERE id = $1 AND status IN ($4, $5)`,
      [
        id,
        JOB_STATUS.FAILED,
        JSON.stringify(error),
        JOB_STATUS.PENDING,
        JOB_STATUS.RUNNING,
      ],
    );
  }

  /**
   * Отменяет операцию.
   */
  async cancel(id: string): Promise<void> {
    await this.db.execute(
      `UPDATE jobs
             SET status = $2,
                 finished_at = NOW()
             WHERE id = $1 AND status IN ($3, $4)`,
      [id, JOB_STATUS.CANCELLED, JOB_STATUS.PENDING, JOB_STATUS.RUNNING],
    );
  }

  /**
   * Обновляет прогресс и проверяет запрос на отмену.
   */
  async reportProgress(
    id: string,
    progress: ProgressUpdate,
  ): Promise<{ cancelRequested: boolean }> {
    const row = await this.db.queryOne<{ cancel_requested_at: Date | null }>(
      `UPDATE jobs
             SET processed_count = $2,
                 total_count = COALESCE($3::int, total_count)
             WHERE id = $1 AND status = $4
             RETURNING cancel_requested_at`,
      [
        id,
        progress.processedCount,
        progress.totalCount ?? null,
        JOB_STATUS.RUNNING,
      ],
    );

    return { cancelRequested: Boolean(row?.cancel_requested_at) };
  }

  /**
   * Запрашивает отмену операции.
   * Ожидающая операция отменяется сразу, выполняющаяся отменится при следующей проверке.
   */
  async requestCancel(id: string): Promise<Job | null> {
    return await this.db.queryOne<Job>(
      `UPDATE jobs
             SET cancel_requested_at = NOW(),
                 status = CASE WHEN status = $2 THEN $3 ELSE status END,
                 finished_at = CASE WHEN status = $2 THEN NOW() ELSE finished_at END
             WHERE id = $1 AND status IN ($2, $4)
             RETURNING *`,
      [id, JOB_STATUS.PENDING, JOB_STATUS.CANCELLED, JOB_STATUS.RUNNING],
      this.metadata.columns,
    );
  }
}
