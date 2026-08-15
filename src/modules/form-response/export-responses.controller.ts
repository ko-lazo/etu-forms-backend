import type { Request, Response } from "express";

import { getRouteParam } from "@/shared/http/http.params.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { ForbiddenError } from "@/shared/errors/forbidden.error.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import type { FormService } from "@/modules/form/form.service.js";
import type { FormPolicy } from "@/modules/form/form.policy.js";
import { jobMapper, type JobService } from "@/modules/job/index.js";
import { EXPORT_RESPONSES_JOB_TYPE } from "./handlers/export-responses.handler.js";

export class ExportResponsesController {
  constructor(
    private readonly formService: FormService,
    private readonly formPolicy: FormPolicy,
    private readonly jobService: JobService,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const formId = getRouteParam(req, "formId");
    const form = await this.formService.findById(formId);

    if (!form) {
      throw new NotFoundError("Форма не найдена");
    }

    if (!this.formPolicy.update(req.user.id, form)) {
      throw new ForbiddenError();
    }

    const idempotencyKey = req.header("Idempotency-Key");

    const job = await this.jobService.enqueue({
      type: EXPORT_RESPONSES_JOB_TYPE,
      userId: req.user.id,
      payload: { formId: form.id },
      ...(idempotencyKey
        ? {
            idempotencyKey: `${EXPORT_RESPONSES_JOB_TYPE}:${req.user.id}:${idempotencyKey}`,
          }
        : {}),
    });

    res.status(202).json(jobMapper.toResponse(job));
  };
}
