import { dbClient } from "@/core/database/pool.js";

import { FormController } from "./form.controller.js";

import { FormRepository } from "./form.repository.js";

import { createFormRoutes } from "./form.routes.js";

import { FormService } from "./form.service.js";

export function createFormModule() {
  const repository = new FormRepository(dbClient);

  const service = new FormService(repository);

  const controller = new FormController(service);

  const routes = createFormRoutes(controller);

  return {
    repository,
    service,
    controller,
    routes,
  };
}
