import { UnrecoverableError, Worker, type Job as BullJob } from "bullmq";

import { jobConfig } from "@/config/index.js";
import { pool } from "@/core/database/pool.js";
import { createRedisConnection } from "@/core/queue/connection.js";
import { closeJobQueue, type JobQueueData } from "@/core/queue/job-queue.js";
import { JobRunContext } from "@/modules/job/contract/job.context.js";
import {
  PermanentJobError,
  toJobError,
} from "@/modules/job/contract/job.error.js";
import { isTerminal } from "@/modules/job/job.domain.js";
import { logger, serializeError } from "@/shared/logger/logger.js";
import { registerShutdownHandlers } from "@/shared/process/shutdown.js";
import {
  createWorkerContainer,
  type WorkerContainer,
} from "./worker.container.js";

/**
 * Запускает обработку фоновой операции.
 *
 * BullMQ управляет очередью и повторами, а обработчик — состоянием
 * операции в БД.
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

  if (isTerminal(row.status)) {
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
  }, jobConfig.progressIntervalMs);

  try {
    jobLogger.info({ type: started.type }, "Job started");

    const result = await registry.run(started.type, started.payload, context);

    await jobRepository.succeed(started.id, result, context.progress);

    jobLogger.info("Job completed");
  } catch (error) {
    // Set by the progress ticker above; TS cannot see the interval callback run.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (cancelled) {
      await jobRepository.cancel(started.id);
      jobLogger.info("Job cancelled");
      return;
    }

    if (error instanceof PermanentJobError) {
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
 * Создаёт и запускает обработчик фоновых операций.
 * Сохраняет окончательную ошибку, когда попытки выполнения закончились.
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
