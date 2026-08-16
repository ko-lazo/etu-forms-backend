import type { Request } from "express";

import { BaseSubController } from "@/core/controllers/base.sub-controller.js";
import { getRouteParam } from "@/shared/http/http.params.js";
import type { FindContext } from "@/core/repositories/repository.interface.js";
import type {
  CreateFormResponseDto,
  FormResponseDto,
} from "./form-response.dto.js";
import type {
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate,
} from "../form-response.types.js";
import type { FormResponseService } from "../form-response.service.js";
import { FormResponseScope } from "../db/form-response.scope.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { type FormResponsePolicy } from "../form-response.policy.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";

// todo refactor?
export class FormResponseController extends BaseSubController<
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate,
  FormResponseDto
> {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    formResponseService: FormResponseService,
    formResponsePolicy: FormResponsePolicy,
  ) {
    super(formResponseService, formResponsePolicy);
  }

  protected override getParentId(req: Request): string {
    return getRouteParam(req, "formId");
  }

  protected override belongsToParent(
    entity: FormResponse,
    parentId: string,
  ): boolean {
    return entity.formId === parentId;
  }

  protected override buildCreateDataForParent(
    req: Request,
    parentId: string,
  ): FormResponseCreate {
    const dto = req.body as CreateFormResponseDto;

    return {
      ...dto,
      formId: parentId,
      submittedAt: dto.submittedAt ?? null,
    };
  }

  protected override getFindAllOptions(
    req: Request,
  ): FindContext<FormResponse> {
    const formId = this.getParentId(req);

    if (!req.user) {
      throw new UnauthorizedError();
    }

    return {
      scope: new FormResponseScope(formId, req.user.id),
      pagination: new BasePagination({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      }),
    };
  }
}
