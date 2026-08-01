import { dbClient } from "@/core/database/pool.js";
import { ApiTokenRepository } from "./api-token.repository.js";
import { ApiTokenService } from "./api-token.service.js";
import { ApiTokenGeneratorService } from "./api-token-generator.service.js";
import { ApiTokenController } from "./api-token.controller.js";
import { TokenGenerator } from "@/shared/security/token-generator.js";
import { TokenHasher } from "@/shared/security/token-hasher.js";

export function createApiTokenModule() {
  const repository = new ApiTokenRepository(dbClient);
  const generator = new TokenGenerator();
  const hasher = new TokenHasher();

  const service = new ApiTokenService(repository, hasher);
  const generatorService = new ApiTokenGeneratorService(
    repository,
    generator,
    hasher,
  );

  const controller = new ApiTokenController(service, generatorService);

  return {
    repository,
    service,
    generatorService,
    controller,
  };
}
