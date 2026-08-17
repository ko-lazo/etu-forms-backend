import { type ApiTokenRepository } from "./db/api-token.repository.js";
import { type TokenGenerator } from "@/shared/security/token-generator.js";
import { type TokenHasher } from "@/shared/security/token-hasher.js";
import { type ApiToken, type ApiTokenIssuance } from "./api-token.types.js";

export function createApiTokenGeneratorService(
  repository: ApiTokenRepository,
  generator: TokenGenerator,
  hasher: TokenHasher,
) {
  const generate = async (
    userId: string,
    data: ApiTokenIssuance,
  ): Promise<ApiToken & { token: string }> => {
    const plainToken = generator.generate();

    const apiToken = await repository.create({
      name: data.name,
      expiresAt: data.expiresAt ?? null,
      userId,
      token: hasher.hash(plainToken),
    });

    return { ...apiToken, token: plainToken };
  };

  return { generate };
}

export type ApiTokenGeneratorService = ReturnType<
  typeof createApiTokenGeneratorService
>;
