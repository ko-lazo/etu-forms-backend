import { dbClient } from "@/core/database/pool.js";
import { jobQueue } from "@/core/queue/job-queue.js";
import { fileStorage } from "@/core/storage/storage.js";
import { JobController } from "./api/job.controller.js";
import { JobRepository } from "./db/job.repository.js";
import { JobService } from "./job.service.js";
import { JobPolicy } from "./job.policy.js";

/**
 * Отвечает за сборку runtime зависимостей
 */
export function createJobModule() {
  const repository = new JobRepository(dbClient);

  const service = new JobService(repository, jobQueue);

  const policy = new JobPolicy();

  const controller = new JobController(service, policy, fileStorage);

  return {
    repository,
    service,
    controller,
    policy,
  };
}
