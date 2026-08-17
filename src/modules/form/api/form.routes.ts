import { Router } from "express";
import type { FormController } from "./form.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { formDto } from "./form.dto.js";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";
import { type OptionalAuthMiddleware } from "@/shared/http/middleware/optional-auth.middleware.js";

export function createFormRoutes(
  controller: FormController,
  authMiddleware: AuthMiddleware,
  optionalAuthMiddleware: OptionalAuthMiddleware,
): Router {
  const router = Router();

  router.get(
    "/",
    authMiddleware,
    validate(formDto.findSchema, "query"),
    controller.findAll,
  );
  router.get("/:id", optionalAuthMiddleware, controller.findById);
  router.post(
    "/",
    authMiddleware,
    validate(formDto.createSchema),
    controller.create,
  );
  router.patch(
    "/:id",
    authMiddleware,
    validate(formDto.updateSchema),
    controller.update,
  );
  router.delete("/:id", authMiddleware, controller.delete);

  router.post("/:id/publish", authMiddleware, controller.publish);
  router.post("/:id/unpublish", authMiddleware, controller.unpublish);
  router.post("/:id/archive", authMiddleware, controller.archive);
  router.post("/:id/unarchive", authMiddleware, controller.unarchive);

  return router;
}
