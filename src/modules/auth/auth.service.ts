import { type LoginDto } from "./auth.dto.js";
import type { User, UserService } from "@/modules/user/index.js";
import { type PasswordHasher } from "@/shared/security/password-hasher.js";
import type {
  ApiToken,
  ApiTokenGeneratorService,
} from "@/modules/api-token/index.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";

export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: ApiTokenGeneratorService,
  ) {}

  async login(dto: LoginDto): Promise<ApiToken & { token: string }> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError();
    }

    const isPasswordValid = await this.passwordHasher.verify(
      user.password,
      dto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError();
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return await this.tokenGenerator.generate(user.id, {
      name: `Session Token (${new Date().toLocaleDateString()})`,
      expiresAt: expiresAt,
    });
  }

  async getMe(userId: string): Promise<User> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    return user;
  }
}
