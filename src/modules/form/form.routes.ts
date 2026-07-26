import { Router } from "express";
import type { FormController } from "./form.controller.js";
import { validate } from "../../shared/http/middleware/validate.middleware";
import { createFormSchema } from "./form.validation.js";

export function createFormRoutes(controller: FormController): Router {
  const router = Router();

  router.get("/", (req, res) => controller.findAll(req, res));
  router.get("/:id", (req, res) => controller.findById(req, res));
  router.post("/", validate(createFormSchema), (req, res) =>
    controller.create(req, res),
  );

  return router;
}
