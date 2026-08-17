import { Router } from "express";
import type { FormResponseController } from "./form-response.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { formResponseDto } from "./form-response.dto.js";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";
import { type OptionalAuthMiddleware } from "@/shared/http/middleware/optional-auth.middleware.js";

export function createFormResponseRoutes(
  controller: FormResponseController,
  authMiddleware: AuthMiddleware,
  optionalAuthMiddleware: OptionalAuthMiddleware,
): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    authMiddleware,
    validate(formResponseDto.findSchema, "query"),
    controller.findAll,
  );

  router.get("/:id", optionalAuthMiddleware, controller.findById);

  router.post(
    "/",
    optionalAuthMiddleware,
    validate(formResponseDto.createSchema),
    controller.create,
  );

  router.patch(
    "/:id",
    optionalAuthMiddleware,
    validate(formResponseDto.updateSchema),
    controller.update,
  );

  return router;
}
