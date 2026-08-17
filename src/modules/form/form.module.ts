import { dbClient } from "@/core/database/pool.js";
import { createFormController } from "./api/form.controller.js";
import { FormRepository } from "./db/form.repository.js";
import { createFormService } from "./form.service.js";
import { createFormPolicy } from "./form.policy.js";

export function createFormModule() {
  const repository = new FormRepository(dbClient);

  const service = createFormService(repository);

  const policy = createFormPolicy();

  const controller = createFormController(service, policy);

  return {
    repository,
    service,
    controller,
    policy,
  };
}
