import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),

  CORS_ORIGIN: z.url(),

  STORAGE_PATH: z.string().min(1).default("storage"),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().int().positive().default(10),
});

export const env = Object.freeze(envSchema.parse(process.env));
