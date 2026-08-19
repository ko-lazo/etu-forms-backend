import { z } from "zod";
import { aiResponseSchema, type AiResponse } from "./ai-constructor.types.js";
import { type FormSchema } from "@/modules/form/index.js";
import { toStrictJsonSchema } from "./strict-schema.formatter.js";

// todo отделить работу с openRouter в отдельный файл наподобие с IFileStorage
// todo нормальная выдача ошибок
const openRouterResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().nullable(),
      }),
    }),
  ),
});

export type AiConstructorService = {
  generateResponse(input: {
    prompt: string;
    form: FormSchema;
  }): Promise<AiResponse>;
};

export function createAiConstructorService(config: {
  apiKey: string;
  model: string;
  timeoutMs: number;
}): AiConstructorService {
  async function generateResponse(options: {
    prompt: string;
    form: FormSchema;
  }): Promise<AiResponse> {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.timeout(config.timeoutMs),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          provider: { require_parameters: true },
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ai_form_response",
              strict: true,
              schema: responseJsonSchema,
            },
          },
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(),
            },
            {
              role: "user",
              content: buildUserPrompt({
                prompt: options.prompt,
                form: options.form,
              }),
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`OpenRouter request failed: ${response.status} ${body}`);
    }

    const data = openRouterResponseSchema.parse(await response.json());

    const content = data.choices[0]?.message.content;

    if (!content) {
      throw new Error("OpenRouter returned empty content");
    }

    return aiResponseSchema.parse(
      dropNulls(JSON.parse(extractJsonString(content))),
    );
  }

  return {
    generateResponse,
  };
}

const responseJsonSchema = buildResponseJsonSchema();

/**
 * Превращает zod-схему в строгий JSON для OpenAI.
 * Отрезает техническое поле $schema, иначе API вернет ошибку валидации.
 */
function buildResponseJsonSchema(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(aiResponseSchema, {
    io: "input",
    target: "draft-7",
  });
  delete jsonSchema.$schema;
  return toStrictJsonSchema(jsonSchema);
}

/**
 * Вычищает необязательные поля
 */
function dropNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(dropNulls);

  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== null)
      .map(([key, item]) => [key, dropNulls(item)]),
  );
}

/**
 * Достаёт json из markdown ответа модели при необходимости
 * */
function extractJsonString(content: string): string {
  const fenced = /^\s*```(?:json)?\s*\n([\s\S]*?)\n\s*```\s*$/.exec(content);

  return fenced?.[1] ?? content;
}

// todo типы полей брать из zod схемы?
//  или можно просто попробовать отправлять zod схему напрямую
// todo вынести промпт в отдельный файл
function buildSystemPrompt(): string {
  return `
Ты - конструктор форм.

Твоя задача — изменить существующую форму
согласно пожеланию пользователя.

Поддерживаются только следующие типы полей:
- text
- email
- textarea
- number
- dropdown
- radiogroup
- checkbox

Никогда не придумывай новые типы полей.

У каждого поля обязательны "name" (латиница, начинается с буквы)
и "label" - человекочитаемая подпись.
Поля dropdown, radiogroup и checkbox обязаны содержать "choices"
- непустой массив объектов { "value", "text" }.

Если пользователь просит возможность, которой нет
в текущей структуре формы, верни status="unsupported".

Если запрос невозможно однозначно выполнить,
верни status="ambiguous".

Если запрос можно выполнить,
верни status="ok" и полную изменённую форму в поле "form".

В поле "message" коротко опиши на русском, что было сделано
или почему запрос не выполнен.

Не изменяй части формы, о которых пользователь
не просил.

Необязательные поля ("visibleIf", "placeholder", "validation")
добавляй только если пользователь прямо об этом попросил,
иначе просто опусти их. Никогда не отдавай "visibleIf"
пустым объектом — либо полное условие, либо поля нет.

Ответ должен содержать только JSON.
`;
}

function buildUserPrompt(input: { prompt: string; form: FormSchema }): string {
  return `
Текущая форма:

${JSON.stringify(input.form, null, 2)}

Пожелание пользователя:

${input.prompt}
`;
}
