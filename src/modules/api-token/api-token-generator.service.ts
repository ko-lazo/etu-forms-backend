import { type ApiTokenRepository } from "./db/api-token.repository.js";
import { type TokenGenerator } from "@/shared/security/token-generator.js";
import { type TokenHasher } from "@/shared/security/token-hasher.js";
import { type ApiToken, type ApiTokenIssuance } from "./api-token.types.js";

export class ApiTokenGeneratorService {
  constructor(
    private readonly repository: ApiTokenRepository,
    private readonly generator: TokenGenerator,
    private readonly hasher: TokenHasher,
  ) {}

  async generate(
    userId: string,
    data: ApiTokenIssuance,
  ): Promise<ApiToken & { token: string }> {
    const plainToken = this.generator.generate();
    const apiToken = await this.repository.create({
      name: data.name,
      expiresAt: data.expiresAt ?? null,
      userId,
      token: this.hasher.hash(plainToken),
    });
    return { ...apiToken, token: plainToken };
  }
}
