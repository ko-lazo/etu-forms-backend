import { z } from "zod";
import { ServiceUnavailableError } from "@/shared/errors/service-unavailable.error.js";
import { logger, serializeError } from "@/shared/logger/logger.js";
import { toStrictJsonSchema } from "./strict-schema.formatter.js";
import type { AiConfig, AiService, StructuredRequest } from "./ai.types.js";
import { HTTP_METHOD, sendHttpRequest } from "@/shared/http/http-request.js";

export const completionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable() }) }))
    .min(1),
});

const TOO_MANY_REQUESTS = 429;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export function createAiService(config: AiConfig): AiService {
  async function ask<TSchema extends z.ZodType>(
    request: StructuredRequest<TSchema>,
  ): Promise<z.infer<TSchema>> {
    const content = await checkAnswerIsReady(request);
    const formattedJson = dropNulls(parseJson(content));
    const parsed = request.schema.safeParse(formattedJson);

    if (!parsed.success) {
      throw throwServiceError("Answer validation error", parsed.error.issues);
    }

    return parsed.data;
  }

  async function send(
    request: StructuredRequest<z.ZodType>,
  ): Promise<Response> {
    return await sendHttpRequest(`${config.baseUrl}/chat/completions`, {
      method: HTTP_METHOD.POST,
      timeoutMs: config.timeoutMs,
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: buildRequestBody(config, request),
    }).catch((error: unknown) => {
      throw throwServiceError("Request not send", error);
    });
  }

  async function checkAnswerIsReady(
    request: StructuredRequest<z.ZodType>,
    attempt = 1,
  ): Promise<string> {
    const response = await send(request);

    if (response.status === TOO_MANY_REQUESTS && attempt <= MAX_RETRIES) {
      await wait(incrementDelayMs(response, attempt));
      return await checkAnswerIsReady(request, attempt + 1);
    }

    const body = await response.text();

    if (!response.ok) {
      throw throwServiceError(`Status ${response.status}`, body);
    }

    return extractContent(body);
  }

  return {
    ask,
  };
}

function buildRequestBody(
  config: AiConfig,
  request: StructuredRequest<z.ZodType>,
): Record<string, unknown> {
  return {
    model: config.model,
    messages: request.messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: request.name,
        strict: true,
        schema: toJsonSchema(request.schema),
      },
    },
  };
}

function extractContent(responseBody: string): string {
  const parsed = completionSchema.safeParse(parseJson(responseBody));
  const content = parsed.success
    ? parsed.data.choices[0]?.message.content
    : null;

  if (!content) {
    throw throwServiceError("Empty or unexpected response", responseBody);
  }

  return content;
}

function incrementDelayMs(response: Response, attempt: number): number {
  const retryAfter = Number(response.headers.get("retry-after"));

  return Number.isFinite(retryAfter) && retryAfter > 0
    ? retryAfter * 1000
    : RETRY_DELAY_MS * attempt;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throwServiceError(reason: string, details: unknown): Error {
  const info = details instanceof Error ? serializeError(details) : { details };
  logger.error({ reason, ...info }, "AI service error");
  return new ServiceUnavailableError("AI-сервис временно недоступен");
}

const jsonSchemaCache = new WeakMap<z.ZodType, Record<string, unknown>>();

/**
 * Превращает zod-схему в строгий JSON для OpenAI.
 * Отрезает техническое поле $schema, иначе API вернет ошибку валидации.
 */
function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const cached = jsonSchemaCache.get(schema);
  if (cached) return cached;
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema, {
    io: "input",
    target: "draft-7",
  });
  const strict = toStrictJsonSchema(jsonSchema);
  jsonSchemaCache.set(schema, strict);
  return strict;
}

/**
 * Достаёт json из markdown ответа модели при необходимости
 */
function parseJson(content: string): unknown {
  const fenced = /^\s*```(?:json)?\s*\n([\s\S]*?)\n\s*```\s*$/.exec(content);

  try {
    return JSON.parse(fenced?.[1] ?? content);
  } catch {
    throw throwServiceError("Response is not valid JSON", content);
  }
}

/**
 * вычищает необязательные для схемы поля, пришедшие от ИИ
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
