import type { Request } from "express";

import { type Handler } from "@/core/controllers/resource-handlers.js";
import type { Form, FormPolicy, FormService } from "@/modules/form/index.js";
import { jobMapper, type JobService } from "@/modules/job/index.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { ensureAllowed, requireUser } from "@/shared/http/authorize.js";
import { getRouteParam } from "@/shared/http/http.params.js";

import { EXPORT_JOB_TYPE } from "../export/export.types.js";

export function createExportController(
  formService: FormService,
  formPolicy: FormPolicy,
  jobService: JobService,
) {
  const findExportableForm = async (
    req: Request,
    userId: string,
  ): Promise<Form> => {
    const form = await formService.findById(getRouteParam(req, "formId"));

    if (!form) {
      throw new NotFoundError("Форма не найдена");
    }

    ensureAllowed(userId, await formPolicy.update(userId, form));

    return form;
  };

  const scopeIdempotencyKey = (req: Request, userId: string): string | null => {
    const key = req.header("Idempotency-Key");

    return key === undefined ? null : `${EXPORT_JOB_TYPE}:${userId}:${key}`;
  };

  const create: Handler = async (req, res) => {
    const userId = requireUser(req);
    const form = await findExportableForm(req, userId);

    const job = await jobService.enqueue({
      type: EXPORT_JOB_TYPE,
      userId,
      payload: { formId: form.id },
      idempotencyKey: scopeIdempotencyKey(req, userId),
    });

    res.status(202).json(jobMapper.toResponse(job));
  };

  return { create };
}

export type ExportController = ReturnType<typeof createExportController>;
