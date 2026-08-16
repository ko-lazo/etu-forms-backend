import { Router } from "express";
import { ApiTokenController } from "./api-token.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { apiTokenDto } from "./api-token.dto.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

export function createApiTokenRoutes(
  controller: ApiTokenController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(authMiddleware.handle);

  router.get("/", controller.findAll);
  router.delete("/:id", controller.delete);
  router.post("/", validate(apiTokenDto.createSchema), controller.create);

  return router;
}
