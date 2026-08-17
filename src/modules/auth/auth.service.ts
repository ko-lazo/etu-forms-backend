import type {
  ApiToken,
  ApiTokenGeneratorService,
} from "@/modules/api-token/index.js";
import type { User, UserService } from "@/modules/user/index.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { type PasswordHasher } from "@/shared/security/password-hasher.js";
import { type LoginDto } from "./auth.dto.js";

export function createAuthService(
  userService: UserService,
  passwordHasher: PasswordHasher,
  tokenGenerator: ApiTokenGeneratorService,
) {
  const login = async (
    dto: LoginDto,
  ): Promise<ApiToken & { token: string }> => {
    const user = await userService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedError();
    }

    const isPasswordValid = await passwordHasher.verify(
      user.password,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError();
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return await tokenGenerator.generate(user.id, {
      name: `Session Token (${new Date().toLocaleDateString()})`,
      expiresAt,
    });
  };

  const getMe = async (userId: string): Promise<User> => {
    const user = await userService.findById(userId);

    if (!user) {
      throw new UnauthorizedError();
    }

    return user;
  };

  return { login, getMe };
}

export type AuthService = ReturnType<typeof createAuthService>;
