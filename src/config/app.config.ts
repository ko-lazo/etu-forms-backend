import { env } from './env.js';

export const appConfig = {
  port: env.PORT,
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isDevelopment: env.NODE_ENV === "development",
  isTest: env.NODE_ENV === "test",
} as const;
