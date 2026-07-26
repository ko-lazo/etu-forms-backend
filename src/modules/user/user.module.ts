import { dbClient } from "../../core/database/pool";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { PasswordHasher } from "../../shared/security/password-hasher";
import { UserController } from "./user.controller";
import { createUserRoutes } from "./user.routes";

export function createUserModule() {
  const repository = new UserRepository(dbClient);

  const passwordHasher = new PasswordHasher();

  const service = new UserService(repository, passwordHasher);

  const controller = new UserController(service);

  const routes = createUserRoutes(controller);

  return {
    repository,
    service,
    controller,
    routes,
  };
}
