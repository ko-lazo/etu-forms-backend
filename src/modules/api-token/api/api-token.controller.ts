import type { Request, Response } from "express";
import { createResourceHandlers } from "@/core/controllers/resource-handlers.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { ensureAllowed, requireUser } from "@/shared/http/authorize.js";
import { getValidatedQuery } from "@/shared/http/http.params.js";

import { type ApiTokenGeneratorService } from "../api-token-generator.service.js";
import { type ApiTokenPolicy } from "../api-token.policy.js";
import { type ApiTokenService } from "../api-token.service.js";
import { API_TOKEN_TYPE } from "../api-token.types.js";
import { ApiTokenScope } from "../db/api-token.scope.js";
import {
  type CreateApiTokenDto,
  type FindApiTokenDto,
} from "./api-token.dto.js";
import {
  apiTokenMapper,
  toIssuedApiTokenResponse,
} from "./api-token.mapper.js";

export function createApiTokenController(
  service: ApiTokenService,
  policy: ApiTokenPolicy,
  generatorService: ApiTokenGeneratorService,
) {
  const crud = createResourceHandlers({
    service,
    policy,
    mapper: apiTokenMapper,

    buildFindContext: (req) => ({
      scope: new ApiTokenScope(requireUser(req)),
      pagination: new BasePagination(getValidatedQuery<FindApiTokenDto>(req)),
    }),

    buildCreateContext: () => undefined,
  });

  async function create(req: Request, res: Response): Promise<void> {
    const userId = requireUser(req);
    ensureAllowed(userId, await policy.create(userId, undefined));

    const issued = await generatorService.generate(userId, {
      ...(req.body as CreateApiTokenDto),
      type: API_TOKEN_TYPE.PERSONAL,
    });

    res.status(201).json(toIssuedApiTokenResponse(issued));
  }

  return { ...crud, create };
}

export type ApiTokenController = ReturnType<typeof createApiTokenController>;
