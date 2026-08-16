import { Router } from "express";
import { UserController } from "./user.controller.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

export function createUserRoutes(
  controller: UserController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(authMiddleware.handle);

  // todo admin middleware
  // router.get("/", controller.findAll);
  // router.get("/:id", controller.findById);
  // router.post("/", validate(userDto.createSchema), controller.create);

  return router;
}
