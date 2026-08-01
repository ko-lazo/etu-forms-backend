import { Router } from "express";
import { container } from "@/app/app.container.js";

import { createApiTokenRoutes } from "@/modules/api-token/api-token.routes.js";
import { createUserRoutes } from "@/modules/user/user.routes.js";
import { createFormRoutes } from "@/modules/form/form.routes.js";
import { createAuthRoutes } from "@/modules/auth/auth.routes.js";

export function createApiRoutes(): Router {
  const apiRoutes = Router();

  const { authMiddleware } = container;
  const { controller: apiTokenController } = container.apiToken;
  const { controller: userController } = container.user;
  const { controller: formController } = container.form;
  const { controller: authController } = container.auth;

  apiRoutes.use("/auth", createAuthRoutes(authController));
  apiRoutes.use(
    "/tokens",
    createApiTokenRoutes(apiTokenController, authMiddleware),
  );
  apiRoutes.use("/users", createUserRoutes(userController, authMiddleware));
  apiRoutes.use("/forms", createFormRoutes(formController, authMiddleware));

  return apiRoutes;
}
