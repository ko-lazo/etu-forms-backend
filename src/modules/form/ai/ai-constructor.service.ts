import { renderPrompt, type AiService } from "@/modules/ai/index.js";
import { type FormSchema } from "@/modules/form/index.js";
import { formElementTypes } from "../schema/form-schema.schema.js";
import { aiResponseSchema, type AiResponse } from "./ai-constructor.types.js";

const AI_CONSTRUCTOR_TASK = "ai_form_constructor" as const;

const PROMPT_FILES = {
  SYSTEM: "ai-constructor.system.md",
  USER: "ai-constructor.user.md",
} as const;

export type AiConstructorService = {
  generateResponse(input: {
    prompt: string;
    form: FormSchema;
  }): Promise<AiResponse>;
};

export function createAiConstructorService(
  ai: AiService,
): AiConstructorService {
  async function generateResponse(input: {
    prompt: string;
    form: FormSchema;
  }): Promise<AiResponse> {
    const systemMessage = await renderSystemPrompt();
    const userMessage = await renderUserPrompt(input.prompt, input.form);

    return await ai.ask({
      name: AI_CONSTRUCTOR_TASK,
      schema: aiResponseSchema,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });
  }

  return {
    generateResponse,
  };
}

async function renderSystemPrompt(): Promise<string> {
  const availableFieldTypes = formElementTypes
    .map((type) => `- ${type}`)
    .join("\n");

  return await renderPrompt(PROMPT_FILES.SYSTEM, {
    fieldTypes: availableFieldTypes,
  });
}

async function renderUserPrompt(
  userPrompt: string,
  form: FormSchema,
): Promise<string> {
  const formattedFormJson = JSON.stringify(form, null, 2);

  return await renderPrompt(PROMPT_FILES.USER, {
    form: formattedFormJson,
    prompt: userPrompt,
  });
}
