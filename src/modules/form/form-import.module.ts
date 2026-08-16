import { dbClient } from "@/core/database/pool.js";
import { fileStorage } from "@/core/storage/storage.js";
import type { DatabaseClient } from "@/core/database/database.client.js";
import type { IJobResultWriter, JobService } from "@/modules/job/index.js";
import { FormRepository } from "./form.repository.js";
import { ImportFormController } from "./import-form.controller.js";
import { ImportFormHandler } from "./handlers/import-form.handler.js";

export type FormImportModuleDeps = {
  readonly jobService: JobService;
  readonly jobResultWriter: IJobResultWriter;
};

export function createFormImportModule(deps: FormImportModuleDeps) {
  const controller = new ImportFormController(fileStorage, deps.jobService);

  const handler = new ImportFormHandler(
    fileStorage,
    dbClient,
    deps.jobResultWriter,
    (db: DatabaseClient) => new FormRepository(db),
  );

  return { controller, handler };
}
