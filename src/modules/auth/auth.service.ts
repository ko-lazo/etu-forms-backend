import { LoginDto } from "./auth.dto.js";
import { UserRepository } from "@/modules/user/user.repository.js";
import { PasswordHasher } from "@/shared/security/password-hasher.js";
import { ApiTokenGeneratorService } from "@/modules/api-token/api-token-generator.service.js";
import { ApiToken } from "@/modules/api-token/api-token.types.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { UserResponseDto } from "@/modules/user/user.dto.js";
import { User } from "@/modules/user/user.types.js";

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: ApiTokenGeneratorService,
  ) {}

  async login(dto: LoginDto): Promise<ApiToken & { token: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
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
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError();
    }
    return user;
  }
}
