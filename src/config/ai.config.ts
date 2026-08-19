import path from "node:path";
import { env } from "./env.js";

export const aiConfig = {
  apiKey: env.AI_API_KEY,
  baseUrl: env.AI_BASE_URL,
  model: env.AI_MODEL,
  /** Таймаут одного ответа */
  timeoutMs: env.AI_TIMEOUT_MS,
  promptsDir: path.resolve(env.AI_PROMPTS_PATH),
  /** Сколько запросов к ИИ доступно одному пользователю в сутки */
  dailyLimit: env.AI_DAILY_LIMIT,
} as const;
