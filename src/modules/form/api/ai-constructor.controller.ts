import type { Request, Response } from "express";
import { z } from "zod";

import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { ensureAllowed } from "@/shared/http/authorize.js";

import { type AiConstructorService } from "../ai/ai-constructor.service.js";
import { type FormPolicy } from "../form.policy.js";
import { type FormService } from "../form.service.js";
import type { Form } from "../form.types.js";
import { formMapper } from "./form.mapper.js";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(5000),
});

export const createAiConstructorController = (input: {
  aiConstructorService: AiConstructorService;
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

    const result = await input.aiConstructorService.generateResponse({
      prompt,
      form: form.schema,
    });

    if (result.status !== "ok" || !result.form) {
      res.status(200).json({
        status: result.status,
        message: result.message,
        form: null,
      });

      return;
    }

    const updated = await input.formService.update(form.id, {
      schema: result.form,
    });

    res.status(200).json({
      status: result.status,
      message: result.message,
      form: formMapper.toResponse(updated),
    });
  }

  return {
    generate,
  };
};

export type AiConstructorController = ReturnType<
  typeof createAiConstructorController
>;
