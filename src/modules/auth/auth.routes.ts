import { Router } from "express";

import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { loginRateLimit } from "@/shared/http/middleware/rate-limit.middleware.js";
import { authDto } from "./auth.dto.js";
import { AuthController } from "./auth.controller.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

export function createAuthRoutes(
  controller: AuthController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.post(
    "/login",
    loginRateLimit,
    validate(authDto.loginSchema),
    controller.login,
  );

  router.get("/me", authMiddleware.handle, controller.me);

  return router;
}
