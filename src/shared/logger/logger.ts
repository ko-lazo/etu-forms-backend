import pino from "pino";
import { appConfig } from "@/config/index.js";

export type LogContext = Record<string, unknown>;
export type Logger = pino.Logger;

export const logger: Logger = pino({
  level: appConfig.isProduction ? "info" : "debug",

  ...(!appConfig.isProduction
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

/**
 * Раскладывает ошибку в контекст логов
 */
export function serializeError(error: unknown): LogContext {
  if (!(error instanceof Error)) {
    return { err: String(error) };
  }

  return {
    err: {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      ...(error.cause ? { cause: String(error.cause) } : {}),
    },
  };
}
