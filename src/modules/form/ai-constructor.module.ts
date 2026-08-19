import type { AiQuota, AiService } from "@/modules/ai/index.js";
import type { FormPolicy } from "./form.policy.js";
import type { FormService } from "./form.service.js";
import { createAiConstructorController } from "./api/ai-constructor.controller.js";
import { createAiConstructorService } from "./ai/ai-constructor.service.js";

export type AiConstructorModuleDeps = {
  readonly aiService: AiService;
  readonly aiQuota: AiQuota;
  readonly formService: FormService;
  readonly formPolicy: FormPolicy;
};

export function createAiConstructorModule(deps: AiConstructorModuleDeps) {
  const service = createAiConstructorService(deps.aiService);

  const controller = createAiConstructorController({
    aiConstructorService: service,
    aiQuota: deps.aiQuota,
    formService: deps.formService,
    formPolicy: deps.formPolicy,
  });

  return { controller };
}
