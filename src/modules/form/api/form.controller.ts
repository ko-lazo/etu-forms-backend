import type { Request, Response } from "express";
import { BaseController } from "@/core/controllers/base.controller.js";
import type { FormService } from "../form.service.js";
import type { Form, FormCreate, FormUpdate } from "../form.types.js";
import {
  formLifecycleSchema,
  type CreateFormDto,
  type FindFormDto,
  type FormResponseDto,
} from "./form.dto.js";
import { FormScope } from "../db/form.scope.js";
import { FormFilter } from "../db/form.filter.js";
import { getRouteParam, getValidatedQuery } from "@/shared/http/http.params.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { ForbiddenError } from "@/shared/errors/forbidden.error.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { type FindContext } from "@/core/repositories/repository.interface.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { type FormPolicy } from "../form.policy.js";
import { formMapper } from "./form.mapper.js";

export class FormController extends BaseController<
  Form,
  FormCreate,
  FormUpdate,
  FormResponseDto
> {
  constructor(
    private readonly formService: FormService,
    private readonly formPolicy: FormPolicy,
  ) {
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
    const dto = getValidatedQuery<FindFormDto>(req);
    return {
      scope: new FormScope(req.user.id),
      filter: new FormFilter(dto),
      pagination: new BasePagination(dto),
    };
  }

  publish = async (req: Request, res: Response): Promise<void> => {
    const form = await this.findOwned(req);

    const published = await this.formService.publish(
      form,
      this.resolveTransitionDate(req),
    );

    res.status(200).json(formMapper.toResponse(published));
  };

  unpublish = async (req: Request, res: Response): Promise<void> => {
    const form = await this.findOwned(req);

    const unpublished = await this.formService.unpublish(form);

    res.status(200).json(formMapper.toResponse(unpublished));
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    const form = await this.findOwned(req);

    const archived = await this.formService.archive(
      form,
      this.resolveTransitionDate(req),
    );

    res.status(200).json(formMapper.toResponse(archived));
  };

  unarchive = async (req: Request, res: Response): Promise<void> => {
    const form = await this.findOwned(req);

    const unarchived = await this.formService.unarchive(form);

    res.status(200).json(formMapper.toResponse(unarchived));
  };

  /**
   * Определяет точную дату для изменения статуса формы.
   * Если дата в запросе не указана, переход применяется мгновенно.
   * @throws {BadRequestError} Если данные в теле запроса не соответствуют схеме валидации.
   */
  private resolveTransitionDate(req: Request): Date {
    const parsed = formLifecycleSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      throw new BadRequestError("Validation failed", parsed.error.issues);
    }

    return parsed.data.date ?? new Date();
  }

  private async findOwned(req: Request): Promise<Form> {
    const id = getRouteParam(req, "id");
    const form = await this.formService.findById(id);

    if (!form) {
      throw new NotFoundError("Форма не найдена");
    }

    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!this.formPolicy.update(req.user.id, form)) {
      throw new ForbiddenError();
    }

    return form;
  }
}
