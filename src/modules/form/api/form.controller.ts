import type { Request, Response } from "express";
import { BaseController } from "@/core/controllers/base.controller.js";
import type { FormService } from "../form.service.js";
import type { Form, FormCreate, FormUpdate } from "../form.types.js";
import { CreateFormDto, FindFormDto, FormResponseDto } from "./form.dto.js";
import { FormScope } from "../db/form.scope.js";
import { FormFilter } from "../db/form.filter.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { FindContext } from "@/core/repositories/repository.interface.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { FormPolicy } from "../form.policy.js";
import { formMapper } from "./form.mapper.js";

export class FormController extends BaseController<
  Form,
  FormCreate,
  FormUpdate,
  FormResponseDto
> {
  constructor(formService: FormService, formPolicy: FormPolicy) {
    super(formService, formPolicy, formMapper);
  }

  protected override buildCreateData(req: Request): FormCreate {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    return {
      ...(req.body as CreateFormDto),
      userId: req.user.id,
    };
  }

  protected override getFindAllOptions(req: Request): FindContext<Form> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const dto = req.query as unknown as FindFormDto;
    return {
      scope: new FormScope(req.user.id),
      filter: new FormFilter(dto),
      pagination: new BasePagination(dto),
    };
  }
}
