import { dbClient } from '@/core/database/pool.js';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';
import { PasswordHasher } from '@/shared/security/password-hasher.js';
import { UserController } from './user.controller.js';
import { createUserRoutes } from './user.routes.js';

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
