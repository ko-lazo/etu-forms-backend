import { env } from "./env.js";

export const appConfig = {
  port: env.PORT,
  trustProxy: env.TRUST_PROXY,
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",
  showDebugInfo: env.DEBUG,
  jsonBodyLimit: `${env.JSON_BODY_MAX_SIZE_KB}kb`,
} as const;
