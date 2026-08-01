import { BaseService } from "@/core/services/base.service.js";
import { ApiToken } from "@/modules/api-token/api-token.types.js";
import {
  CreateApiTokenDto,
  UpdateApiTokenDto,
} from "@/modules/api-token/api-token.dto.js";
import { ApiTokenRepository } from "@/modules/api-token/api-token.repository.js";
import { TokenHasher } from "@/shared/security/token-hasher.js";
import { IAuthTokenValidator } from "@/shared/http/auth-service.interface.js";

export class ApiTokenService
  extends BaseService<ApiToken, CreateApiTokenDto, UpdateApiTokenDto>
  implements IAuthTokenValidator
{
  constructor(
    protected override readonly repository: ApiTokenRepository,
    private readonly hasher: TokenHasher,
  ) {
    super(repository);
  }

  async validateToken(plainToken: string) {
    const hashed = this.hasher.hash(plainToken);
    const tokenData = await this.repository.findByToken(hashed);
    if (!tokenData || (tokenData.expiresAt && tokenData.expiresAt < new Date()))
      return null;
    return { userId: tokenData.userId };
  }
}
