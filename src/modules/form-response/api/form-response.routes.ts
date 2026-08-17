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
    authMiddleware.handle,
    validate(formResponseDto.findSchema, "query"),
    (req, res) => controller.findAll(req, res),
  );

  router.get("/:id", optionalAuthMiddleware.handle, (req, res) =>
    controller.findById(req, res),
  );

  router.post(
    "/",
    optionalAuthMiddleware.handle,
    validate(formResponseDto.createSchema),
    (req, res) => controller.create(req, res),
  );

  router.patch(
    "/:id",
    optionalAuthMiddleware.handle,
    validate(formResponseDto.updateSchema),
    (req, res) => controller.update(req, res),
  );

  return router;
}
