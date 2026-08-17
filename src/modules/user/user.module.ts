import { dbClient } from "@/core/database/pool.js";
import { UserRepository } from "./db/user.repository.js";
import { UserService } from "./user.service.js";
import { PasswordHasher } from "@/shared/security/password-hasher.js";

export function createUserModule() {
  const repository = new UserRepository(dbClient);

  const passwordHasher = new PasswordHasher();

  const service = new UserService(repository, passwordHasher);

  return {
    repository,
    service,
  };
}
