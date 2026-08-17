import { dbClient } from "@/core/database/pool.js";
import { UserRepository } from "./db/user.repository.js";
import { createUserService } from "./user.service.js";
import { PasswordHasher } from "@/shared/security/password-hasher.js";

export function createUserModule() {
  const repository = new UserRepository(dbClient);

  const passwordHasher = new PasswordHasher();

  const service = createUserService(repository, passwordHasher);

  return {
    repository,
    service,
  };
}
