import type { Request } from "express";
import { createResourceHandlers } from "@/core/controllers/resource-handlers.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { requireUser } from "@/shared/http/authorize.js";
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

  return createResourceHandlers({
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
    buildCreateData: (req, parentId) => {
      const dto = req.body as CreateFormResponseDto;

      return { ...dto, formId: parentId, submittedAt: dto.submittedAt ?? null };
    },
  });
}

export type FormResponseController = ReturnType<
  typeof createFormResponseController
>;
