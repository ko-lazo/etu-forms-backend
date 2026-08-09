import { dbClient } from "@/core/database/pool.js";
import { FormService } from "@/modules/form/form.service.js";
import { FormRepository } from "@/modules/form/form.repository.js";
import { FormResponseController } from "./form-response.controller.js";
import { FormResponseRepository } from "./form-response.repository.js";
import { FormResponseService } from "./form-response.service.js";

export function createFormResponseModule(formService: FormService) {
  const repository = new FormResponseRepository(dbClient);

  const service = new FormResponseService(repository, formService);

  const controller = new FormResponseController(service);

  return {
    repository,
    service,
    controller,
  };
}
