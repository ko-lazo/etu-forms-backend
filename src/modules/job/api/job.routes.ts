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
    authMiddleware,
    validate(jobDto.findSchema, "query"),
    controller.findAll,
  );
  router.get("/:id", authMiddleware, controller.findById);
  router.post("/:id/cancel", authMiddleware, controller.cancel);
  router.get("/:id/download", authMiddleware, controller.download);

  return router;
}
