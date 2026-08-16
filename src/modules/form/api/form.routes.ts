import { Router } from "express";
import type { FormController } from "./form.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { formDto } from "./form.dto.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";
import { OptionalAuthMiddleware } from "@/shared/http/middleware/optional-auth.middleware.js";

export function createFormRoutes(
  controller: FormController,
  authMiddleware: AuthMiddleware,
  optionalAuthMiddleware: OptionalAuthMiddleware,
): Router {
  const router = Router();

  router.get("/", authMiddleware.handle, (req, res) =>
    controller.findAll(req, res),
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

  return router;
}
