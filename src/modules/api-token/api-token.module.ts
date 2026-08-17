import { dbClient } from "@/core/database/pool.js";
import { ApiTokenRepository } from "./db/api-token.repository.js";
import { createApiTokenService } from "./api-token.service.js";
import { createApiTokenGeneratorService } from "./api-token-generator.service.js";
import { createApiTokenController } from "./api/api-token.controller.js";
import { TokenGenerator } from "@/shared/security/token-generator.js";
import { TokenHasher } from "@/shared/security/token-hasher.js";
import { createApiTokenPolicy } from "./api-token.policy.js";

export function createApiTokenModule() {
  const repository = new ApiTokenRepository(dbClient);
  const generator = new TokenGenerator();
  const hasher = new TokenHasher();

  const service = createApiTokenService(repository, hasher);
  const policy = createApiTokenPolicy();

  const generatorService = createApiTokenGeneratorService(
    repository,
    generator,
    hasher,
  );

  const controller = createApiTokenController(
    service,
    policy,
    generatorService,
  );

  return {
    repository,
    service,
    generatorService,
    policy,
    controller,
  };
}
