import { Router } from "express";
import type { FormResponseController } from "./form-response.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { formResponseDto } from "./form-response.dto.js";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

export function createFormResponseRoutes(
  controller: FormResponseController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router({ mergeParams: true });

  router.get("/", authMiddleware.handle, (req, res) =>
    controller.findAll(req, res),
  );

  router.get("/:id", (req, res) => controller.findById(req, res));

  router.post("/", validate(formResponseDto.createSchema), (req, res) =>
    controller.create(req, res),
  );

  router.patch("/:id", validate(formResponseDto.updateSchema), (req, res) =>
    controller.update(req, res),
  );

  return router;
}
