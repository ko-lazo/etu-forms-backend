import { Router } from "express";
import type { ExportResponsesController } from "./export-responses.controller.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

export function createExportResponsesRoutes(
  controller: ExportResponsesController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router({ mergeParams: true });

  router.post("/", authMiddleware.handle, (req, res) =>
    controller.create(req, res),
  );

  return router;
}
