import type { Queue } from "bullmq";

import { BaseService } from "@/core/services/base.service.js";
import type { JobQueueData } from "@/core/queue/job-queue.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { ServiceUnavailableError } from "@/shared/errors/service-unavailable.error.js";
import { logger, serializeError } from "@/shared/logger/logger.js";
import { JobRepository } from "./db/job.repository.js";
import { isTerminal } from "./job.domain.js";
import { type Job, type JobCreate, type JobUpdate } from "./job.types.js";

export class JobService extends BaseService<Job, JobCreate, JobUpdate> {
  constructor(
    protected override readonly repository: JobRepository,
    private readonly queue: Queue<JobQueueData>,
  ) {
    super(repository);
  }

  /**
   * todo: падение процесса между бд и redis оставит задачу в pending
   *
   * Добавляет задачу в очередь
   */
  async enqueue(data: JobCreate): Promise<Job> {
    const job = await this.repository.findOrCreate(data);

    if (isTerminal(job.status)) {
      return job;
    }

    try {
      await this.queue.add(job.type, { jobId: job.id }, { jobId: job.id });
    } catch (error) {
      logger.error(
        {
          jobId: job.id,
          ...serializeError(error),
        },
        "Не удалось поставить задачу в очередь",
      );

      await this.repository.fail(job.id, {
        code: "ENQUEUE_FAILED",
        message: "Не удалось поставить операцию в очередь",
      });

      throw new ServiceUnavailableError(
        "Очередь фоновых задач недоступна, попробуйте позже",
      );
    }

    return job;
  }

  /**
   * Запрос отмены операции
   */
  async requestCancel(id: string): Promise<Job> {
    const job = await this.repository.requestCancel(id);

    if (!job) {
      throw new BadRequestError("Задача уже завершена, отменять нечего");
    }

    return job;
  }
}
