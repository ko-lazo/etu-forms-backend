import type { Request, Response } from "express";
import { BaseController } from "@/core/controllers/base.controller.js";
import type { FormService } from "./form.service.js";
import type { Form } from "./form.types.js";
import {
  CreateFormDto,
  FormQueryDto,
  FormResponseDto,
  UpdateFormDto,
} from "@/modules/form/form.dto.js";
import { FindAllOptions } from "@/core/repositories/repository.interface.js";
import { FormScope } from "@/modules/form/form.scope.js";
import { FormFilter } from "@/modules/form/form.filter.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";

export class FormController extends BaseController<
  Form,
  CreateFormDto,
  UpdateFormDto,
  FormResponseDto
> {
  constructor(formService: FormService) {
    super(formService);
  }

  // todo refactor
  protected override getFindAllOptions(req: Request): FindAllOptions {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    return {
      scope: new FormScope(req.user.id),
      filter: new FormFilter(req.query as FormQueryDto),
    };
  }
}
