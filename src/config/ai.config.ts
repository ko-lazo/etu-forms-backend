import path from "node:path";
import { env } from "./env.js";

export const aiConfig = {
  apiKey: env.AI_API_KEY,
  baseUrl: env.AI_BASE_URL,
  model: env.AI_MODEL,
  timeoutMs: env.AI_TIMEOUT_MS,
  promptsDir: path.resolve(env.AI_PROMPTS_PATH),
  dailyLimitPerUser: env.AI_DAILY_LIMIT_PER_USER,
} as const;
