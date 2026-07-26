import { dbClient } from "../../core/database/pool";

import { FormController } from "./form.controller";

import { FormRepository } from "./form.repository";

import { createFormRoutes } from "./form.routes";

import { FormService } from "./form.service";

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
