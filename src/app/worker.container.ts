import { JobRegistry } from "@/modules/job/job.registry.js";
import type { JobRepository } from "@/modules/job/db/job.repository.js";
import { container } from "./app.container.js";

export type WorkerContainer = {
  readonly jobRepository: JobRepository;
  readonly registry: JobRegistry;
};

/**
 * Собирает зависимости для обработки фоновых операций.
 * Здесь регистрируются все доступные обработчики.
 */
export function createWorkerContainer(): WorkerContainer {
  container.init();

  const registry = new JobRegistry()
    .register(container.exportResponses.handler)

  return {
    jobRepository: container.job.repository,
    registry,
  };
}
