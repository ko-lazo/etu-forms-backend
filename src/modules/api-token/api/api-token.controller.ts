import type { Request, Response } from "express";
import { BaseController } from "@/core/controllers/base.controller.js";
import {
  type ApiToken,
  type ApiTokenCreate,
  type ApiTokenUpdate,
} from "../api-token.types.js";
import {
  type ApiTokenResponseDto,
  type CreateApiTokenDto,
} from "./api-token.dto.js";
import { type ApiTokenService } from "../api-token.service.js";
import { type ApiTokenGeneratorService } from "../api-token-generator.service.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { type FindContext } from "@/core/repositories/repository.interface.js";
import { ApiTokenScope } from "../db/api-token.scope.js";
import { type ApiTokenPolicy } from "../api-token.policy.js";
import {
  apiTokenMapper,
  toIssuedApiTokenResponse,
} from "./api-token.mapper.js";

export class ApiTokenController extends BaseController<
  ApiToken,
  ApiTokenCreate,
  ApiTokenUpdate,
  ApiTokenResponseDto
> {
  constructor(
    service: ApiTokenService,
    policy: ApiTokenPolicy,
    private readonly generatorService: ApiTokenGeneratorService,
  ) {
    super(service, policy, apiTokenMapper);
  }

  override create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const dto = req.body as CreateApiTokenDto;

    if (!userId) {
      throw new UnauthorizedError();
    }

    const result = await this.generatorService.generate(userId, dto);

    res.status(201).json(toIssuedApiTokenResponse(result));
  };

  protected override getFindAllOptions(req: Request): FindContext<ApiToken> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return {
      scope: new ApiTokenScope(req.user.id),
    };
  }
}
