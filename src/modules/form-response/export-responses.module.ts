import { fileStorage } from "@/core/storage/storage.js";
import type { FormService } from "@/modules/form/form.service.js";
import type { FormPolicy } from "@/modules/form/form.policy.js";
import type { JobService } from "@/modules/job/index.js";
import type { FormResponseRepository } from "./form-response.repository.js";
import { ExportResponsesController } from "./export-responses.controller.js";
import { ExportResponsesHandler } from "./handlers/export-responses.handler.js";

export type ExportResponsesModuleDeps = {
  readonly formService: FormService;
  readonly formPolicy: FormPolicy;
  readonly jobService: JobService;
  readonly responseRepository: FormResponseRepository;
};

export function createExportResponsesModule(deps: ExportResponsesModuleDeps) {
  const controller = new ExportResponsesController(
    deps.formService,
    deps.formPolicy,
    deps.jobService,
  );

  const handler = new ExportResponsesHandler(
    deps.formService,
    deps.responseRepository,
    fileStorage,
  );

  return { controller, handler };
}
