import { Router } from "express";
import { container } from "@/app/app.container.js";

import { createApiTokenRoutes } from "@/modules/api-token/api-token.routes.js";
import { createUserRoutes } from "@/modules/user/user.routes.js";
import { createFormRoutes } from "@/modules/form/form.routes.js";
import { createAuthRoutes } from "@/modules/auth/auth.routes.js";
import { createFormResponseRoutes } from "@/modules/form-response/form-response.routes.js";

export function createApiRoutes(): Router {
  const apiRoutes = Router();

  const { authMiddleware } = container;
  const { controller: authController } = container.auth;
  const { controller: apiTokenController } = container.apiToken;
  const { controller: userController } = container.user;
  const { controller: formController } = container.form;
  const { controller: formResponseController } = container.formResponse;

  apiRoutes.use("/auth", createAuthRoutes(authController));
  apiRoutes.use(
    "/tokens",
    createApiTokenRoutes(apiTokenController, authMiddleware),
  );
  apiRoutes.use("/users", createUserRoutes(userController, authMiddleware));
  apiRoutes.use("/forms", createFormRoutes(formController, authMiddleware));
  apiRoutes.use(
    "/forms/:formId/responses",
    createFormResponseRoutes(formResponseController, authMiddleware),
  );

  return apiRoutes;
}
