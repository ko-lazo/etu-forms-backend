import { createCrudService } from "@/core/services/crud.service.js";
import { type TokenHasher } from "@/shared/security/token-hasher.js";
import { type ApiTokenRepository } from "./db/api-token.repository.js";

export function createApiTokenService(
  repository: ApiTokenRepository,
  hasher: TokenHasher,
) {
  async function validateToken(
    plainToken: string,
  ): Promise<{ userId: string } | null> {
    const apiToken = await repository.findByToken(hasher.hash(plainToken));

    if (!apiToken || (apiToken.expiresAt && apiToken.expiresAt < new Date())) {
      return null;
    }

    return { userId: apiToken.userId };
  }

  return {
    ...createCrudService(repository),
    validateToken,
  };
}

export type ApiTokenService = ReturnType<typeof createApiTokenService>;
