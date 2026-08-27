import type { Request, Response } from "express";
import { z } from "zod";

import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { ensureAllowed, requireUser } from "@/shared/http/authorize.js";
import type { AiQuota } from "@/modules/ai/index.js";

import { type AiConstructorService } from "../ai/ai-constructor.service.js";
import { type FormPolicy } from "../form.policy.js";
import { type FormService } from "../form.service.js";
import type { Form } from "../form.types.js";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(5000),
});

export const createAiConstructorController = (input: {
  aiConstructorService: AiConstructorService;
  aiQuota: AiQuota;
  formService: FormService;
  formPolicy: FormPolicy;
}) => {
  async function findOwnedOrFail(req: Request): Promise<Form> {
    const form = await input.formService.findById(req.params.formId as string);

    if (!form) throw new NotFoundError();

    ensureAllowed(
      req.user?.id,
      await input.formPolicy.update(req.user?.id, form),
    );

    return form;
  }

  async function generate(req: Request, res: Response): Promise<void> {
    const { prompt } = requestSchema.parse(req.body);
    const form = await findOwnedOrFail(req);
    const userId = requireUser(req);

    await input.aiQuota.spendOrFail(userId);

    const result = await input.aiConstructorService.generateResponse({
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
};

export type AiConstructorController = ReturnType<
  typeof createAiConstructorController
>;
