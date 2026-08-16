import { dbClient } from "@/core/database/pool.js";
import type { FormPolicy, FormService } from "@/modules/form/index.js";
import { FormResponseController } from "./api/form-response.controller.js";
import { FormResponseRepository } from "./db/form-response.repository.js";
import { FormResponsePolicy } from "./form-response.policy.js";
import { FormResponseService } from "./form-response.service.js";

export type FormResponseModuleDeps = {
  readonly formService: FormService;
  readonly formPolicy: FormPolicy;
};

export function createFormResponseModule(deps: FormResponseModuleDeps) {
  const repository = new FormResponseRepository(dbClient);

  const service = new FormResponseService(repository, deps.formService);

  const policy = new FormResponsePolicy(deps.formService, deps.formPolicy);

  const controller = new FormResponseController(service, policy);

  return {
    repository,
    service,
    policy,
    controller,
  };
}
