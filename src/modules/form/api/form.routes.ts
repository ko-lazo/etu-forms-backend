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
    authMiddleware.handle,
    validate(formDto.findSchema, "query"),
    controller.findAll,
  );
  router.get("/:id", optionalAuthMiddleware.handle, controller.findById);
  router.post(
    "/",
    authMiddleware.handle,
    validate(formDto.createSchema),
    controller.create,
  );
  router.patch(
    "/:id",
    authMiddleware.handle,
    validate(formDto.updateSchema),
    controller.update,
  );
  router.delete("/:id", authMiddleware.handle, controller.delete);

  router.post("/:id/publish", authMiddleware.handle, controller.publish);
  router.post("/:id/unpublish", authMiddleware.handle, controller.unpublish);
  router.post("/:id/archive", authMiddleware.handle, controller.archive);
  router.post("/:id/unarchive", authMiddleware.handle, controller.unarchive);

  return router;
}
