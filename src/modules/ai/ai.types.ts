import { type z } from "zod";

export type ChatMessage = {
  readonly role: "system" | "user";
  readonly content: string;
};

export type StructuredRequest<TSchema extends z.ZodType> = {
  readonly name: string;
  readonly schema: TSchema;
  readonly messages: readonly ChatMessage[];
};

export type AiService = {
  ask<TSchema extends z.ZodType>(
    request: StructuredRequest<TSchema>,
  ): Promise<z.infer<TSchema>>;
};

export type AiConfig = {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly timeoutMs: number;
};
