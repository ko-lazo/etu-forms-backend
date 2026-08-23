import type { Request, Response } from "express";
import { createResourceHandlers } from "@/core/controllers/resource-handlers.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { ensureAllowed, requireUser } from "@/shared/http/authorize.js";
import { getRouteParam, getValidatedQuery } from "@/shared/http/http.params.js";
import { FormResponseFilter } from "../db/form-response.filter.js";
import { FormResponseScope } from "../db/form-response.scope.js";
import { type FormResponsePolicy } from "../form-response.policy.js";
import { type FormResponseService } from "../form-response.service.js";
import type {
  CreateFormResponseDto,
  FindFormResponseDto,
} from "./form-response.dto.js";
import { formResponseMapper } from "./form-response.mapper.js";

export function createFormResponseController(
  service: FormResponseService,
  policy: FormResponsePolicy,
) {
  const getFormId = (req: Request): string => getRouteParam(req, "formId");

  const { findOrFail, ...crud } = createResourceHandlers({
    service,
    policy,
    mapper: formResponseMapper,

    belongsTo: (response, req) => response.formId === getFormId(req),

    buildFindContext: (req) => {
      const query = getValidatedQuery<FindFormResponseDto>(req);

      return {
        scope: new FormResponseScope(getFormId(req), requireUser(req)),
        filter: new FormResponseFilter(query),
        pagination: new BasePagination(query),
      };
    },

    buildCreateContext: getFormId,
    buildCreateData: (req, parentId) => ({
      ...(req.body as CreateFormResponseDto),
      formId: parentId,
      submittedAt: null,
    }),
  });

  async function submit(req: Request, res: Response): Promise<void> {
    const response = await findOrFail(req);
    ensureAllowed(req.user?.id, await policy.update(req.user?.id, response));

    const submitted = await service.submit(response);

    res.status(200).json(formResponseMapper.toResponse(submitted));
  }

  return { ...crud, submit };
}

export type FormResponseController = ReturnType<
  typeof createFormResponseController
>;
