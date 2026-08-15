import { dbClient } from "@/core/database/pool.js";
import { FormService } from "@/modules/form/form.service.js";
import { FormResponseController } from "./form-response.controller.js";
import { FormResponseRepository } from "./form-response.repository.js";
import { FormResponseService } from "./form-response.service.js";

export type FormResponseModuleDeps = {
  readonly formService: FormService;
};

export function createFormResponseModule(deps: FormResponseModuleDeps) {
  const repository = new FormResponseRepository(dbClient);

  const service = new FormResponseService(repository, deps.formService);

  const controller = new FormResponseController(service);

  return {
    repository,
    service,
    controller,
  };
}
