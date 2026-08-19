import { renderPrompt, type AiService } from "@/modules/ai/index.js";
import { type FormSchema } from "@/modules/form/index.js";
import { aiResponseSchema, type AiResponse } from "./ai-constructor.types.js";

export type AiConstructorService = {
  generateResponse(input: {
    prompt: string;
    form: FormSchema;
  }): Promise<AiResponse>;
};

export function createAiConstructorService(
  ai: AiService,
): AiConstructorService {
  const generateResponse = async (input: {
    prompt: string;
    form: FormSchema;
  }): Promise<AiResponse> => {
    const [system, user] = await Promise.all([
      renderPrompt("ai-constructor.system.md"),
      renderPrompt("ai-constructor.user.md", {
        form: JSON.stringify(input.form, null, 2),
        prompt: input.prompt,
      }),
    ]);

    return await ai.ask({
      name: "ai_form_constructor",
      schema: aiResponseSchema,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
  };

  return {
    generateResponse,
  };
}
