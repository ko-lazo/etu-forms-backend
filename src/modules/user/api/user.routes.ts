import { Router } from "express";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

export function createUserRoutes(authMiddleware: AuthMiddleware): Router {
  const router = Router();

  router.use(authMiddleware.handle);

  // todo admin middleware
  // router.get("/", controller.findAll);
  // router.get("/:id", controller.findById);
  // router.post("/", validate(userDto.createSchema), controller.create);

  return router;
}
