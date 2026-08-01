import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { authDto } from "./auth.dto.js";

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post("/login", validate(authDto.loginSchema), controller.login);

  return router;
}
