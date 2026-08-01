import { ApiTokenRepository } from "@/modules/api-token/api-token.repository.js";
import { TokenGenerator } from "@/shared/security/token-generator.js";
import { TokenHasher } from "@/shared/security/token-hasher.js";
import { CreateApiTokenDto } from "@/modules/api-token/api-token.dto.js";
import { ApiToken } from "@/modules/api-token/api-token.types.js";

export class ApiTokenGeneratorService {
  constructor(
    private readonly repository: ApiTokenRepository,
    private readonly generator: TokenGenerator,
    private readonly hasher: TokenHasher,
  ) {}

  async generate(
    userId: string,
    dto: CreateApiTokenDto,
  ): Promise<ApiToken & { token: string }> {
    const plainToken = this.generator.generate();
    const apiToken = await this.repository.create({
      name: dto.name,
      expiresAt: dto.expiresAt ?? null,
      userId,
      token: this.hasher.hash(plainToken),
    });
    return { ...apiToken, token: plainToken };
  }
}
