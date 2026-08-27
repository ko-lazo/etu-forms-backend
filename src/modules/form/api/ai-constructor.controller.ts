import type { Request, Response } from "express";
import { createFindOrFail } from "@/core/controllers/resource-handlers.js";
import type { AiQuota } from "@/modules/ai/index.js";
import { ensureAllowed, requireUser } from "@/shared/http/authorize.js";
import { type AiConstructorService } from "../ai/ai-constructor.service.js";
import { type FormPolicy } from "../form.policy.js";
import { type FormService } from "../form.service.js";
import type { Form } from "../form.types.js";
import type { GenerateFormDto } from "./ai-constructor.dto.js";

export function createAiConstructorController(
  service: AiConstructorService,
  quota: AiQuota,
  formService: FormService,
  formPolicy: FormPolicy,
) {
  const findFormOrFail = createFindOrFail({
    service: formService,
    param: "formId",
  });

  async function findOwnedOrFail(req: Request, userId: string): Promise<Form> {
    const form = await findFormOrFail(req);
    ensureAllowed(userId, await formPolicy.update(userId, form));
    return form;
  }

  async function generate(req: Request, res: Response): Promise<void> {
    const { prompt } = req.body as GenerateFormDto;
    const userId = requireUser(req);
    const form = await findOwnedOrFail(req, userId);

    await quota.spendOrFail(userId);

    const result = await service.generateResponse({
      prompt,
      form: form.schema,
    });

    res.status(200).json({
      status: result.status,
      message: result.message,
      schema: result.form ?? null,
    });
  }

  return {
    generate,
  };
}

export type AiConstructorController = ReturnType<
  typeof createAiConstructorController
>;
