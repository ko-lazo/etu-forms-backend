import { Router } from "express";
import { container } from "@/app/app.container.js";

import { createApiTokenRoutes } from "@/modules/api-token/api-token.routes.js";
import { createUserRoutes } from "@/modules/user/user.routes.js";
import { createFormRoutes } from "@/modules/form/form.routes.js";
import { createAuthRoutes } from "@/modules/auth/auth.routes.js";
import { createFormResponseRoutes } from "@/modules/form-response/form-response.routes.js";
import { createJobRoutes } from "@/modules/job/job.routes.js";

export function createApiRoutes(): Router {
  const apiRoutes = Router();

  const { authMiddleware } = container;
  const { optionalAuthMiddleware } = container;
  const { controller: authController } = container.auth;
  const { controller: apiTokenController } = container.apiToken;
  const { controller: userController } = container.user;
  const { controller: formController } = container.form;
  const { controller: formResponseController } = container.formResponse;
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
    createFormResponseRoutes(formResponseController, authMiddleware),
  );
  apiRoutes.use("/jobs", createJobRoutes(jobController, authMiddleware));

  return apiRoutes;
}
