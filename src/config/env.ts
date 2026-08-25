import dotenv from "dotenv";
import { expand } from "dotenv-expand";
import { z } from "zod";

expand(dotenv.config());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  DEBUG: z.stringbool().default(false),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),

  CORS_ORIGIN: z.url(),

  STORAGE_PATH: z.string().min(1).default("storage"),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(10),

  REDIS_HOST: z.string().min(1).default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_URL: z.string().min(1).default("redis://127.0.0.1:6379"),

  JOB_CONCURRENCY: z.coerce.number().int().positive().default(2),
  JOB_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),

  AI_API_KEY: z.string().min(1),
  AI_BASE_URL: z.url().default("https://api.mistral.ai/v1"),
  AI_MODEL: z.string().min(1).default("mistral-small-latest"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  AI_PROMPTS_PATH: z.string().min(1).default("prompts"),
  AI_DAILY_LIMIT_PER_USER: z.coerce.number().int().positive().default(20),
});

export const env = Object.freeze(envSchema.parse(process.env));
