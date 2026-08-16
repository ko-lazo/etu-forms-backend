import { Router } from "express";
import type { ImportFormController } from "./import-form.controller.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";
import { uploadCsv } from "@/shared/http/middleware/upload.middleware.js";

export function createImportFormRoutes(
  controller: ImportFormController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.post("/", authMiddleware.handle, uploadCsv, (req, res) =>
    controller.create(req, res),
  );

  return router;
}
