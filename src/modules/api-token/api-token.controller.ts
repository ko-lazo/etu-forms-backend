import type { Request, Response } from "express";
import { BaseController } from "@/core/controllers/base.controller.js";
import { ApiToken } from "@/modules/api-token/api-token.types.js";
import {
  ApiTokenResponseDto,
  CreateApiTokenDto,
  UpdateApiTokenDto,
} from "@/modules/api-token/api-token.dto.js";
import { ApiTokenService } from "@/modules/api-token/api-token.service.js";
import { ApiTokenGeneratorService } from "@/modules/api-token/api-token-generator.service.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";

export class ApiTokenController extends BaseController<
  ApiToken,
  CreateApiTokenDto,
  UpdateApiTokenDto,
  ApiTokenResponseDto
> {
  constructor(
    service: ApiTokenService,
    private readonly generatorService: ApiTokenGeneratorService,
  ) {
    super(service);
  }

  override create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const dto: CreateApiTokenDto = req.body;

    if (!userId) {
      throw new UnauthorizedError();
    }

    const result = await this.generatorService.generate(userId, dto);

    const data = this.mapper ? this.mapper.toResponse(result) : result;
    res.status(201).json(data);
  };
}
