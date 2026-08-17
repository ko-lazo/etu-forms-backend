import { dbClient } from "@/core/database/pool.js";
import type { FormPolicy, FormService } from "@/modules/form/index.js";
import { createFormResponseController } from "./api/form-response.controller.js";
import { FormResponseRepository } from "./db/form-response.repository.js";
import { createFormResponsePolicy } from "./form-response.policy.js";
import { createFormResponseService } from "./form-response.service.js";

export type FormResponseModuleDeps = {
  readonly formService: FormService;
  readonly formPolicy: FormPolicy;
};

export function createFormResponseModule(deps: FormResponseModuleDeps) {
  const repository = new FormResponseRepository(dbClient);

  const service = createFormResponseService(repository, deps.formService);

  const policy = createFormResponsePolicy(deps.formService, deps.formPolicy);

  const controller = createFormResponseController(service, policy);

  return {
    repository,
    service,
    policy,
    controller,
  };
}
