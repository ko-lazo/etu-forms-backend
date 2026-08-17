import { Router } from "express";
import type { JobController } from "./job.controller.js";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { jobDto } from "./job.dto.js";

export function createJobRoutes(
  controller: JobController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get(
    "/",
    authMiddleware.handle,
    validate(jobDto.findSchema, "query"),
    (req, res) => controller.findAll(req, res),
  );
  router.get("/:id", authMiddleware.handle, (req, res) =>
    controller.findById(req, res),
  );
  router.post("/:id/cancel", authMiddleware.handle, (req, res) =>
    controller.cancel(req, res),
  );
  router.get("/:id/download", authMiddleware.handle, (req, res) =>
    controller.download(req, res),
  );

  return router;
}
