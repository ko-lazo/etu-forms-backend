import { createApiTokenModule } from "@/modules/api-token/api-token.module.js";
import { createUserModule } from "@/modules/user/user.module.js";
import { createFormModule } from "@/modules/form/form.module.js";
import { AuthMiddleware } from "@/shared/http/middleware/auth.middleware.js";

class AppContainer {
  private initialized = false;

  public apiToken!: ReturnType<typeof createApiTokenModule>;
  public user!: ReturnType<typeof createUserModule>;
  public form!: ReturnType<typeof createFormModule>;

  public authMiddleware!: AuthMiddleware;

  public init(): void {
    if (this.initialized) return;

    this.apiToken = createApiTokenModule();
    this.user = createUserModule();
    this.form = createFormModule();

    this.authMiddleware = new AuthMiddleware(this.apiToken.service);

    this.initialized = true;
  }
}

export const container = new AppContainer();
