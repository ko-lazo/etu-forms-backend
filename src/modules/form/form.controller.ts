import type { Request, Response } from "express";
import { BaseController } from "@/core/controllers/base.controller.js";
import type { FormService } from "./form.service.js";
import type { Form } from "./form.types.js";
import {
  CreateFormDto,
  FindFormDto,
  FormResponseDto,
  UpdateFormDto,
} from "@/modules/form/form.dto.js";
import { FormScope } from "@/modules/form/form.scope.js";
import { FormFilter } from "@/modules/form/form.filter.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { FindContext } from "@/core/repositories/repository.interface.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { FormPolicy } from "@/modules/form/form.policy.js";

export class FormController extends BaseController<
  Form,
  CreateFormDto,
  UpdateFormDto,
  FormResponseDto
> {
  constructor(formService: FormService, formPolicy: FormPolicy) {
    super(formService, formPolicy);
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
