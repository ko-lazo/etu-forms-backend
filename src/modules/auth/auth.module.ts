import type { UserService } from "@/modules/user/index.js";
import type { ApiTokenGeneratorService } from "@/modules/api-token/index.js";
import { PasswordHasher } from "@/shared/security/password-hasher.js";
import { AuthService } from "./auth.service.js";
import { AuthController } from "./auth.controller.js";
import { createAuthRoutes } from "./auth.routes.js";
import { type AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

interface AuthModuleDependencies {
  userService: UserService;
  tokenGenerator: ApiTokenGeneratorService;
  authMiddleware: AuthMiddleware;
}

export function createAuthModule(deps: AuthModuleDependencies) {
  const passwordHasher = new PasswordHasher();

  const service = new AuthService(
    deps.userService,
    passwordHasher,
    deps.tokenGenerator,
  );
  const controller = new AuthController(service);
  const routes = createAuthRoutes(controller, deps.authMiddleware);

  return {
    service,
    controller,
    routes,
  };
}
