import { Router } from "express";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { type AiConstructorController } from "./ai-constructor.controller.js";
import { aiConstructorDto } from "./ai-constructor.dto.js";

export function createAiConstructorRoutes(
  controller: AiConstructorController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router({ mergeParams: true });

  router.post(
    "/generate",
    authMiddleware,
    validate(aiConstructorDto.generateSchema),
    controller.generate,
  );

  return router;
}
