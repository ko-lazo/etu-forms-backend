import { Router } from "express";
import { UserController } from "./user.controller";
import { validate } from "../../shared/http/middleware/validate.middleware";
import { createUserSchema } from "./user.validation";

export function createUserRoutes(controller: UserController): Router {
  const router = Router();

  router.get("/", controller.findAll);
  router.get("/:id", controller.findById);
  router.post("/", validate(createUserSchema), controller.create);

  return router;
}
