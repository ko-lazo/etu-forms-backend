import type { Request } from "express";

import {
  createResourceHandlers,
  type Handler,
} from "@/core/controllers/resource-handlers.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { ensureAllowed, requireUser } from "@/shared/http/authorize.js";
import { getRouteParam, getValidatedQuery } from "@/shared/http/http.params.js";

import { FormFilter } from "../db/form.filter.js";
import { FormScope } from "../db/form.scope.js";
import { type FormPolicy } from "../form.policy.js";
import { type FormService } from "../form.service.js";
import type { Form } from "../form.types.js";
import {
  formLifecycleSchema,
  type CreateFormDto,
  type FindFormDto,
} from "./form.dto.js";
import { formMapper } from "./form.mapper.js";

export function createFormController(service: FormService, policy: FormPolicy) {
  const crud = createResourceHandlers({
    service,
    policy,
    mapper: formMapper,

    buildFindContext: (req) => {
      const query = getValidatedQuery<FindFormDto>(req);

      return {
        scope: new FormScope(requireUser(req)),
        filter: new FormFilter(query),
        pagination: new BasePagination(query),
      };
    },

    buildCreateContext: () => undefined,
    buildCreateData: (req) => ({
      ...(req.body as CreateFormDto),
      userId: requireUser(req),
    }),
  });

  const findOwned = async (req: Request): Promise<Form> => {
    const form = await service.findById(getRouteParam(req, "id"));

    if (!form) {
      throw new NotFoundError("Форма не найдена");
    }

    ensureAllowed(req.user?.id, await policy.update(req.user?.id, form));

    return form;
  };

  /**
   * Определяет точную дату для изменения статуса формы.
   * Если дата в запросе не указана, переход применяется мгновенно.
   */
  const resolveTransitionDate = (req: Request): Date => {
    const parsed = formLifecycleSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      throw new BadRequestError("Validation failed", parsed.error.issues);
    }

    return parsed.data.date ?? new Date();
  };

  function buildTransition(
    applyTransition: (form: Form, date: Date) => Promise<Form>,
  ): Handler {
    return async (req, res) => {
      const form = await findOwned(req);
      const updated = await applyTransition(form, resolveTransitionDate(req));

      res.status(200).json(formMapper.toResponse(updated));
    };
  }

  return {
    ...crud,
    publish: buildTransition((form, date) => service.publish(form, date)),
    unpublish: buildTransition((form) => service.unpublish(form)),
    archive: buildTransition((form, date) => service.archive(form, date)),
    unarchive: buildTransition((form) => service.unarchive(form)),
  };
}

export type FormController = ReturnType<typeof createFormController>;
