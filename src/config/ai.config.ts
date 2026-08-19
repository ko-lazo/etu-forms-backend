import { env } from "./env.js";

export const aiConfig = {
  apiKey: env.OPENROUTER_API_KEY,
  model: env.OPENROUTER_MODEL,
  /** Таймаут одного ответа */
  timeoutMs: env.OPENROUTER_TIMEOUT_MS,
} as const;
