import { createApiTokenModule } from "@/modules/api-token/api-token.module.js";
import { createUserModule } from "@/modules/user/user.module.js";
import { createFormModule } from "@/modules/form/form.module.js";
import { createFormResponseModule } from "@/modules/form-response/form-response.module.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";
import { createAuthModule } from "@/modules/auth/auth.module.js";
import { OptionalAuthMiddleware } from "@/shared/http/middleware/optional-auth.middleware.js";

class AppContainer {
  private initialized = false;

  public apiToken!: ReturnType<typeof createApiTokenModule>;
  public user!: ReturnType<typeof createUserModule>;
  public form!: ReturnType<typeof createFormModule>;
  public formResponse!: ReturnType<typeof createFormResponseModule>;

  public auth!: ReturnType<typeof createAuthModule>;
  public authMiddleware!: AuthMiddleware;
  public optionalAuthMiddleware!: OptionalAuthMiddleware;

  public init(): void {
    if (this.initialized) return;

    this.user = createUserModule();
    this.apiToken = createApiTokenModule();
    this.authMiddleware = new AuthMiddleware(this.apiToken.service);
    this.optionalAuthMiddleware = new OptionalAuthMiddleware(
      this.apiToken.service,
    );

    this.form = createFormModule();
    this.formResponse = createFormResponseModule(this.form.service);

    this.auth = createAuthModule({
      userRepository: this.user.repository,
      tokenGenerator: this.apiToken.generatorService,
      authMiddleware: this.authMiddleware,
    });

    this.initialized = true;
  }
}

export const container = new AppContainer();
