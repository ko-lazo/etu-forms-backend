import { dbClient } from "@/core/database/pool.js";
import { FormController } from "./form.controller.js";
import { FormRepository } from "./form.repository.js";
import { FormService } from "./form.service.js";

export function createFormModule() {
  const repository = new FormRepository(dbClient);

  const service = new FormService(repository);

  const controller = new FormController(service);

  return {
    repository,
    service,
    controller,
  };
}
