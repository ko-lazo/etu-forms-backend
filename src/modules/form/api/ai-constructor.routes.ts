import { Router } from "express";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";
import { type AiConstructorController } from "./ai-constructor.controller.js";

export function createAiConstructorRoutes(
  controller: AiConstructorController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router({ mergeParams: true });

  router.post("/generate", authMiddleware, controller.generate);

  return router;
}
