import { Router } from "express";
import type { FormResponseController } from "./form-response.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { formResponseLimit } from "@/shared/http/middleware/rate-limit.middleware.js";
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

  router.get(
    "/:id",
    formResponseLimit,
    optionalAuthMiddleware,
    controller.findById,
  );

  router.post(
    "/",
    formResponseLimit,
    optionalAuthMiddleware,
    validate(formResponseDto.createSchema),
    controller.create,
  );

  router.patch(
    "/:id",
    formResponseLimit,
    optionalAuthMiddleware,
    validate(formResponseDto.updateSchema),
    controller.update,
  );

  router.post("/:id/submit", optionalAuthMiddleware, controller.submit);

  return router;
}
