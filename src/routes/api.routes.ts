import { Router } from "express";
import { container } from "@/app/app.container.js";

import { createApiTokenRoutes } from "@/modules/api-token/api-token.routes.js";
import { createUserRoutes } from "@/modules/user/user.routes.js";
import { createFormRoutes } from "@/modules/form/form.routes.js";
import { createAuthRoutes } from "@/modules/auth/auth.routes.js";
import { createFormResponseRoutes } from "@/modules/form-response/form-response.routes.js";
import { createJobRoutes } from "@/modules/job/api/job.routes.js";
import { createExportResponsesRoutes } from "@/modules/form-response/export-responses.routes.js";
import { createImportFormRoutes } from "@/modules/form/import-form.routes.js";

export function createApiRoutes(): Router {
  const apiRoutes = Router();

  const { authMiddleware } = container;
  const { optionalAuthMiddleware } = container;
  const { controller: authController } = container.auth;
  const { controller: apiTokenController } = container.apiToken;
  const { controller: userController } = container.user;
  const { controller: formController } = container.form;
  const { controller: formResponseController } = container.formResponse;
  const { controller: exportController } = container.exportResponses;
  const { controller: jobController } = container.job;
  const { controller: importFormController } = container.formImport;

  apiRoutes.use("/auth", createAuthRoutes(authController, authMiddleware));
  apiRoutes.use(
    "/tokens",
    createApiTokenRoutes(apiTokenController, authMiddleware),
  );
  apiRoutes.use("/users", createUserRoutes(userController, authMiddleware));
  apiRoutes.use(
    "/forms/import",
    createImportFormRoutes(importFormController, authMiddleware),
  );
  apiRoutes.use(
    "/forms",
    createFormRoutes(formController, authMiddleware, optionalAuthMiddleware),
  );
  apiRoutes.use(
    "/forms/:formId/responses",
    createFormResponseRoutes(formResponseController, authMiddleware),
  );
  apiRoutes.use(
    "/forms/:formId/export",
    createExportResponsesRoutes(exportController, authMiddleware),
  );
  apiRoutes.use("/jobs", createJobRoutes(jobController, authMiddleware));

  return apiRoutes;
}
