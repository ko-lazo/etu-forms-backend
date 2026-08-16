import { Router } from "express";
import type { ExportController } from "./export.controller.js";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

export function createExportRoutes(
  controller: ExportController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router({ mergeParams: true });

  router.post("/", authMiddleware.handle, (req, res) =>
    controller.create(req, res),
  );

  return router;
}
