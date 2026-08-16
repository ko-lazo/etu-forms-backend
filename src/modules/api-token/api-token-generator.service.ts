import { ApiTokenRepository } from "./db/api-token.repository.js";
import { TokenGenerator } from "@/shared/security/token-generator.js";
import { TokenHasher } from "@/shared/security/token-hasher.js";
import {ApiToken, ApiTokenIssuance } from "./api-token.types.js";

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
