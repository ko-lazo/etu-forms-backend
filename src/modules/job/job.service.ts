import type { Queue } from "bullmq";

import type { JobQueueData } from "@/core/queue/job-queue.js";
import { type FindContext } from "@/core/repositories/repository.interface.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { ServiceUnavailableError } from "@/shared/errors/service-unavailable.error.js";
import { logger, serializeError } from "@/shared/logger/logger.js";
import { type JobRepository } from "./db/job.repository.js";
import { isFinished } from "./job.domain.js";
import { type Job, type JobCreate } from "./job.types.js";

export function createJobService(
  repository: JobRepository,
  queue: Queue<JobQueueData>,
) {
  const findById = (id: string): Promise<Job | null> => repository.findById(id);

  const findAll = (options?: FindContext<Job>) => repository.findAll(options);

  /**
   * todo: падение процесса между бд и redis оставит задачу в pending
   * Добавляет задачу в очередь
   */
  const enqueue = async (data: JobCreate): Promise<Job> => {
    const job = await repository.findOrCreate(data);

    if (isFinished(job.status)) {
      return job;
    }

    try {
      await queue.add(job.type, { jobId: job.id }, { jobId: job.id });
    } catch (error) {
      logger.error(
        {
          jobId: job.id,
          ...serializeError(error),
        },
        "Не удалось поставить задачу в очередь",
      );

      await repository.fail(job.id, {
        code: "ENQUEUE_FAILED",
        message: "Не удалось поставить операцию в очередь",
      });

      throw new ServiceUnavailableError(
        "Очередь фоновых задач недоступна, попробуйте позже",
      );
    }

    return job;
  };

  const requestCancel = async (id: string): Promise<Job> => {
    const job = await repository.requestCancel(id);

    if (!job) {
      throw new BadRequestError("Задача уже завершена, отменять нечего");
    }

    return job;
  };

  return { findById, findAll, enqueue, requestCancel };
}

export type JobService = ReturnType<typeof createJobService>;
