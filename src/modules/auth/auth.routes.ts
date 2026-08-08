import { Router } from "express";

import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { loginRateLimit } from "@/shared/http/middleware/rate-limit.middleware.js";
import { authDto } from "./auth.dto.js";
import { AuthController } from "./auth.controller.js";

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post(
    "/login",
    loginRateLimit,
    validate(authDto.loginSchema),
    controller.login,
  );

  return router;
}
