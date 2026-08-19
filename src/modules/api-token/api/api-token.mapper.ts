import {
  apiTokenDto,
  issuedApiTokenSchema,
  type ApiTokenResponseDto,
  type IssuedApiTokenDto,
} from "./api-token.dto.js";
import { type ApiToken } from "../api-token.types.js";
import { type IMapper } from "@/core/dto/mapper.interface.js";

export const apiTokenMapper: IMapper<ApiToken, ApiTokenResponseDto> = {
  toResponse(token: ApiToken): ApiTokenResponseDto {
    const raw = {
      id: token.id,
      name: token.name,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    };

    return apiTokenDto.responseSchema.parse(raw);
  },

  toResponseCollection(tokens: ApiToken[]): ApiTokenResponseDto[] {
    return tokens.map((token) => this.toResponse(token));
  },
};

/**
 * Отдаёт только что выпущенный токен вместе с секретом
 */
export function toIssuedApiTokenResponse(
  issued: ApiToken & { token: string },
): IssuedApiTokenDto {
  return issuedApiTokenSchema.parse({
    ...apiTokenMapper.toResponse(issued),
    token: issued.token,
  });
}
