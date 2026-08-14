import path from "node:path";
import { env } from "./env.js";

export const storageConfig = {
  root: path.resolve(env.STORAGE_PATH),
  uploadMaxSizeBytes: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
} as const;
