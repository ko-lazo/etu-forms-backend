import { dbClient } from "@/core/database/pool.js";
import { UserRepository } from "./db/user.repository.js";
import { UserService } from "./user.service.js";
import { PasswordHasher } from "@/shared/security/password-hasher.js";
import { UserController } from "./api/user.controller.js";

export function createUserModule() {
  const repository = new UserRepository(dbClient);

  const passwordHasher = new PasswordHasher();

  const service = new UserService(repository, passwordHasher);

  const controller = new UserController(service);

  return {
    repository,
    service,
    controller,
  };
}
