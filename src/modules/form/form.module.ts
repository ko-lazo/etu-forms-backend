import { dbClient } from "@/core/database/pool.js";
import { FormController } from "./form.controller.js";
import { FormRepository } from "./form.repository.js";
import { FormService } from "./form.service.js";
import { FormPolicy } from "@/modules/form/form.policy.js";

export function createFormModule() {
  const repository = new FormRepository(dbClient);

  const service = new FormService(repository);

  const policy = new FormPolicy();

  const controller = new FormController(service, policy);

  return {
    repository,
    service,
    controller,
    policy,
  };
}
