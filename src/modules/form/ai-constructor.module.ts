import { aiConfig } from "@/config/index.js";
import type { FormPolicy } from "./form.policy.js";
import type { FormService } from "./form.service.js";
import { createAiConstructorController } from "./api/ai-constructor.controller.js";
import { createAiConstructorService } from "./ai/ai-constructor.service.js";

export type AiConstructorModuleDeps = {
  readonly formService: FormService;
  readonly formPolicy: FormPolicy;
};

export function createAiConstructorModule(deps: AiConstructorModuleDeps) {
  const service = createAiConstructorService({
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    timeoutMs: aiConfig.timeoutMs,
  });

  const controller = createAiConstructorController({
    aiConstructorService: service,
    formService: deps.formService,
    formPolicy: deps.formPolicy,
  });

  return { controller };
}
