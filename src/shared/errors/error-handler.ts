import type { ErrorRequestHandler } from "express";
import { BaseError } from "./base-error.js";
import { appConfig } from "@/config/index.js";
import { logger, serializeError } from "@/shared/logger/logger.js";

const formatStack = (stack?: string) =>
  stack?.split("\n").map((line) => line.trim());

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  const showDebugInfo = !appConfig.isProduction;

  if (error instanceof BaseError) {
    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      ...("details" in error ? { details: error.details } : {}),
      ...(showDebugInfo ? { stack: formatStack(error.stack) } : {}),
    });
    return;
  }

  logger.error(serializeError(error), "Unhandled error");

  const debug =
    showDebugInfo && error instanceof Error
      ? { message: error.message, stack: formatStack(error.stack) }
      : undefined;

  response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: debug?.message ?? "Internal Server Error",
    ...(debug ? { stack: debug.stack } : {}),
  });
};
