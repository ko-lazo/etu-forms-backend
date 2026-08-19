import { UnrecoverableError, Worker, type Job as BullJob } from "bullmq";

import { jobConfig } from "@/config/index.js";
import { pool } from "@/core/database/pool.js";
import { createRedisConnection } from "@/core/queue/connection.js";
import { closeJobQueue, type JobQueueData } from "@/core/queue/job-queue.js";
import { JobRunContext } from "@/modules/job/contract/job.context.js";
import { JobFatalError, toJobError } from "@/modules/job/contract/job.error.js";
import { isFinished } from "@/modules/job/job.domain.js";
import { logger, serializeError } from "@/shared/logger/logger.js";
import { registerShutdownHandlers } from "@/shared/process/shutdown.js";
import {
  createWorkerContainer,
  type WorkerContainer,
} from "./worker.container.js";

/**
 * Обработка фоновой операции (джобы).
 * BullMQ управляет очередью Redis, обработчик обновляет статус джобы в БД
 */
async function processJob(
  { jobRepository, registry }: WorkerContainer,
  bullJob: BullJob<JobQueueData>,
): Promise<void> {
  const jobId = bullJob.data.jobId;
  const jobLogger = logger.child({ jobId, attemptsMade: bullJob.attemptsMade });

  const row = await jobRepository.findById(jobId);

  if (!row) {
    throw new UnrecoverableError(`Job ${jobId} not found`);
  }

  if (isFinished(row.status)) {
    jobLogger.info({ status: row.status }, "Job already completed, skipping");
    return;
  }

  if (row.cancelRequestedAt) {
    await jobRepository.cancel(row.id);
    jobLogger.info("Job cancelled before execution");
    return;
  }

  const started = await jobRepository.start(row.id);

  if (!started) {
    jobLogger.info("Job state changed before execution started");
    return;
  }

  const controller = new AbortController();
  const context = new JobRunContext(started, controller.signal, jobLogger);

  let cancelled = false;

  const ticker = setInterval(() => {
    void jobRepository
      .reportProgress(started.id, context.progress)
      .then(({ cancelRequested }) => {
        if (cancelRequested && !cancelled) {
          cancelled = true;
          controller.abort();
        }
      })
      .catch((error: unknown) => {
        jobLogger.warn(serializeError(error), "Failed to update job progress");
      });
  }, jobConfig.syncIntervalMs);

  try {
    jobLogger.info({ type: started.type }, "Job started");

    const result = await registry.run(started.type, started.payload, context);

    await jobRepository.succeed(started.id, result, context.progress);

    jobLogger.info("Job completed");
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cancelled) {
      await jobRepository.cancel(started.id);
      jobLogger.info("Job cancelled");
      return;
    }

    if (error instanceof JobFatalError) {
      await jobRepository.fail(started.id, toJobError(error));
      jobLogger.error(serializeError(error), "Job failed permanently");

      throw new UnrecoverableError(error.message);
    }

    jobLogger.warn(serializeError(error), "Job attempt failed");
    throw error;
  } finally {
    clearInterval(ticker);
  }
}

/**
 * Запускает обработчик, сохраняет ошибку (если есть)
 */
export function startWorker(): Worker<JobQueueData> {
  const workerContainer = createWorkerContainer();
  const { jobRepository, registry } = workerContainer;

  const connection = createRedisConnection();

  const worker = new Worker<JobQueueData>(
    jobConfig.queueName,
    (bullJob) => processJob(workerContainer, bullJob),
    {
      connection,
      concurrency: jobConfig.concurrency,
    },
  );

  worker.on("failed", (bullJob, error) => {
    if (!bullJob) return;

    const maxAttempts = bullJob.opts.attempts ?? 1;

    if (bullJob.attemptsMade < maxAttempts) {
      return;
    }

    void jobRepository
      .fail(bullJob.data.jobId, toJobError(error))
      .catch((writeError: unknown) => {
        logger.error(
          { jobId: bullJob.data.jobId, ...serializeError(writeError) },
          "Failed to persist job failure",
        );
      });
  });

  worker.on("error", (error) => {
    logger.error(serializeError(error), "Worker error");
  });

  logger.info(
    {
      queue: jobConfig.queueName,
      concurrency: jobConfig.concurrency,
      types: registry.types,
    },
    "Worker started",
  );

  registerShutdownHandlers({
    logger,
    timeoutMs: 30_000,
    shutdown: async () => {
      await worker.close();
      await connection.quit();
      await closeJobQueue();
      await pool.end();
    },
  });

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error(serializeError(reason), "Unhandled promise rejection");
  });

  return worker;
}
