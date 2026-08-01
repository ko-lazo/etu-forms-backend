import { Router } from "express";
import type { FormController } from "./form.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { formDto } from "@/modules/form/form.dto.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

export function createFormRoutes(
  controller: FormController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(authMiddleware.handle);

  router.get("/", (req, res) => controller.findAll(req, res));
  router.get("/:id", (req, res) => controller.findById(req, res));
  router.post("/", validate(formDto.createSchema), (req, res) =>
    controller.create(req, res),
  );

  return router;
}
