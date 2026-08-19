import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { BaseError } from "./base-error.js";
import { appConfig } from "@/config/index.js";
import { logger, serializeError } from "@/shared/logger/logger.js";

const formatStack = (stack?: string) =>
  stack?.split("\n").map((line) => line.trim());

const CLIENT_ERROR_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  429: "TOO_MANY_REQUESTS",
};

/**
 * Извлекает HTTP-статус из ошибок сторонних middleware.
 * Возвращает код ошибки, только если это ошибка 4xx.
 */
function getHttpCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const { status, statusCode } = error as {
    status?: unknown;
    statusCode?: unknown;
  };
  const value = typeof status === "number" ? status : statusCode;

  return typeof value === "number" && value >= 400 && value < 500
    ? value
    : null;
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
) => {
  const { showDebugInfo } = appConfig;

  if (error instanceof BaseError) {
    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      ...("details" in error ? { details: error.details } : {}),
      ...(showDebugInfo ? { stack: formatStack(error.stack) } : {}),
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      code: "BAD_REQUEST",
      message: "Validation failed",
      details: error.issues,
    });
    return;
  }

  const clientStatus = getHttpCode(error);

  if (clientStatus !== null) {
    response.status(clientStatus).json({
      code: CLIENT_ERROR_CODES[clientStatus] ?? "BAD_REQUEST",
      message: error instanceof Error ? error.message : "Bad request",
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
