import { pool } from "../../core/database/pool";

import { FormController } from "./form.controller";

import { formMetadata } from "./form.metadata";

import { FormRepository } from "./form.repository";

import { createFormRoutes } from "./form.routes";

import { FormService } from "./form.service";

export function createFormModule() {
  const repository = new FormRepository(pool);

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
