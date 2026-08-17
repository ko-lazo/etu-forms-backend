import { fileStorage } from "@/core/storage/storage.js";
import type { FormPolicy, FormService } from "@/modules/form/index.js";
import type { JobService } from "@/modules/job/index.js";
import type { FormResponseRepository } from "./db/form-response.repository.js";
import { createExportController } from "./api/export.controller.js";
import { ExportHandler } from "./export/export.handler.js";

export type ExportModuleDeps = {
  readonly formService: FormService;
  readonly formPolicy: FormPolicy;
  readonly jobService: JobService;
  readonly responseRepository: FormResponseRepository;
};

export function createExportModule(deps: ExportModuleDeps) {
  const controller = createExportController(
    deps.formService,
    deps.formPolicy,
    deps.jobService,
  );

  const handler = new ExportHandler(
    deps.formService,
    deps.responseRepository,
    fileStorage,
  );

  return { controller, handler };
}
