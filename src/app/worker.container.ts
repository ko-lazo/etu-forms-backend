import { JobRegistry } from "@/modules/job/job.registry.js";
import type { JobRepository } from "@/modules/job/db/job.repository.js";
import { container } from "./app.container.js";

export type WorkerContainer = {
  readonly jobRepository: JobRepository;
  readonly registry: JobRegistry;
};

/**
 * Регистрация фоновых операций (джоб),
 * без регистрации они работать не будут
 */
export function createWorkerContainer(): WorkerContainer {
  container.init();

  const registry = new JobRegistry().register(container.exportResponses.job);

  return {
    jobRepository: container.job.repository,
    registry,
  };
}
