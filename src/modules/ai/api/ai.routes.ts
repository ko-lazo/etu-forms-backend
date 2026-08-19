import { Router } from "express";

import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

import { type AiController } from "./ai.controller.js";

export function createAiRoutes(
  controller: AiController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get("/limit", authMiddleware, controller.limit);

  return router;
}
