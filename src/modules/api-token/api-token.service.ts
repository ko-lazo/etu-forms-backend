import { BaseService } from "@/core/services/base.service.js";
import { ApiToken } from "@/modules/api-token/api-token.types.js";
import {
  CreateApiTokenDto,
  UpdateApiTokenDto,
} from "@/modules/api-token/api-token.dto.js";
import { ApiTokenRepository } from "@/modules/api-token/api-token.repository.js";
import { TokenGenerator } from "@/shared/security/token-generator.js";
import { TokenHasher } from "@/shared/security/token-hasher.js";

export class ApiTokenService extends BaseService<
  ApiToken,
  CreateApiTokenDto,
  UpdateApiTokenDto
> {
  constructor(
    repository: ApiTokenRepository,
    private readonly generator: TokenGenerator,
    private readonly hasher: TokenHasher,
  ) {
    super(repository);
  }
}
