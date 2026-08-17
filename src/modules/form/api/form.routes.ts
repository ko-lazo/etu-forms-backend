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
    (req, res) => controller.findAll(req, res),
  );
  router.get("/:id", optionalAuthMiddleware.handle, (req, res) =>
    controller.findById(req, res),
  );
  router.post(
    "/",
    authMiddleware.handle,
    validate(formDto.createSchema),
    (req, res) => controller.create(req, res),
  );
  router.patch(
    "/:id",
    authMiddleware.handle,
    validate(formDto.updateSchema),
    (req, res) => controller.update(req, res),
  );
  router.delete("/:id", authMiddleware.handle, (req, res) =>
    controller.delete(req, res),
  );
  router.post("/:id/publish", authMiddleware.handle, (req, res) =>
    controller.publish(req, res),
  );
  router.post("/:id/unpublish", authMiddleware.handle, (req, res) =>
    controller.unpublish(req, res),
  );
  router.post("/:id/archive", authMiddleware.handle, (req, res) =>
    controller.archive(req, res),
  );
  router.post("/:id/unarchive", authMiddleware.handle, (req, res) =>
    controller.unarchive(req, res),
  );

  return router;
}
