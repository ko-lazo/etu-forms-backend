import { dbClient } from "@/core/database/pool.js";
import { jobQueue } from "@/core/queue/job-queue.js";
import { fileStorage } from "@/core/storage/storage.js";
import { createJobController } from "./api/job.controller.js";
import { JobRepository } from "./db/job.repository.js";
import { createJobService } from "./job.service.js";
import { createJobPolicy } from "./job.policy.js";

export function createJobModule() {
  const repository = new JobRepository(dbClient);

  const service = createJobService(repository, jobQueue);

  const policy = createJobPolicy();

  const controller = createJobController(service, policy, fileStorage);

  return {
    repository,
    service,
    controller,
    policy,
  };
}
