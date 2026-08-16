import { Router } from "express";
import { container } from "@/app/app.container.js";

import { createApiTokenRoutes } from "@/modules/api-token/api/api-token.routes.js";
import { createUserRoutes } from "@/modules/user/api/user.routes.js";
import { createFormRoutes } from "@/modules/form/api/form.routes.js";
import { createAuthRoutes } from "@/modules/auth/auth.routes.js";
import { createFormResponseRoutes } from "@/modules/form-response/api/form-response.routes.js";
import { createJobRoutes } from "@/modules/job/api/job.routes.js";
import { createExportRoutes } from "@/modules/form-response/api/export.routes.js";

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

  apiRoutes.use("/auth", createAuthRoutes(authController, authMiddleware));
  apiRoutes.use(
    "/tokens",
    createApiTokenRoutes(apiTokenController, authMiddleware),
  );
  apiRoutes.use("/users", createUserRoutes(userController, authMiddleware));
  apiRoutes.use(
    "/forms",
    createFormRoutes(formController, authMiddleware, optionalAuthMiddleware),
  );
  apiRoutes.use(
    "/forms/:formId/responses",
    createFormResponseRoutes(
      formResponseController,
      authMiddleware,
      optionalAuthMiddleware,
    ),
  );
  apiRoutes.use(
    "/forms/:formId/export",
    createExportRoutes(exportController, authMiddleware),
  );
  apiRoutes.use("/jobs", createJobRoutes(jobController, authMiddleware));

  return apiRoutes;
}
