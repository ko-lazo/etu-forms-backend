import type { Request, Response } from "express";
import { createFindOrFail } from "@/core/controllers/resource-handlers.js";
import type { Form, FormPolicy, FormService } from "@/modules/form/index.js";
import { jobMapper, type JobService } from "@/modules/job/index.js";
import { ensureAllowed, requireUser } from "@/shared/http/authorize.js";
import { EXPORT_JOB_TYPE } from "../export/export.types.js";

export function createExportController(
  formService: FormService,
  formPolicy: FormPolicy,
  jobService: JobService,
) {
  const findFormOrFail = createFindOrFail({
    service: formService,
    param: "formId",
  });

  async function findExportableForm(
    req: Request,
    userId: string,
  ): Promise<Form> {
    const form = await findFormOrFail(req);
    ensureAllowed(userId, await formPolicy.update(userId, form));
    return form;
  }

  function scopeIdempotencyKey(req: Request, userId: string): string | null {
    const key = req.header("Idempotency-Key");
    return key === undefined ? null : `${EXPORT_JOB_TYPE}:${userId}:${key}`;
  }

  async function create(req: Request, res: Response): Promise<void> {
    const userId = requireUser(req);
    const form = await findExportableForm(req, userId);

    const job = await jobService.enqueue({
      type: EXPORT_JOB_TYPE,
      userId,
      payload: { formId: form.id },
      idempotencyKey: scopeIdempotencyKey(req, userId),
    });

    res.status(202).json(jobMapper.toResponse(job));
  }

  return { create };
}

export type ExportController = ReturnType<typeof createExportController>;
