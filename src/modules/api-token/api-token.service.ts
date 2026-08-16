import { BaseService } from "@/core/services/base.service.js";
import {
  type ApiToken,
  type ApiTokenCreate,
  type ApiTokenUpdate,
} from "./api-token.types.js";
import { type ApiTokenRepository } from "./db/api-token.repository.js";
import { type TokenHasher } from "@/shared/security/token-hasher.js";
import { type IAuthTokenValidator } from "@/shared/http/auth-service.interface.js";

export class ApiTokenService
  extends BaseService<ApiToken, ApiTokenCreate, ApiTokenUpdate>
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
