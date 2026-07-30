import { Router } from "express";
import { UserController } from "./user.controller.js";
import { validate } from "@/shared/http/middleware/validate.middleware.js";
import { userDto } from "@/modules/user/user.dto.js";

export function createUserRoutes(controller: UserController): Router {
  const router = Router();

  router.get("/", controller.findAll);
  router.get("/:id", controller.findById);
  router.post("/", validate(userDto.createSchema), controller.create);

  return router;
}
