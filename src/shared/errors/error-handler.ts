import type { ErrorRequestHandler } from "express";
import { BaseError } from "./base-error.js";
import { appConfig } from "../../config";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  const showDebugInfo = !appConfig.isProduction;

  const formatStack = (stack?: string) => {
    if (!stack) return undefined;
    return stack.split("\n").map((line) => line.trim());
  };

  if (error instanceof BaseError) {
    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      ...("details" in error ? { details: (error as any).details } : {}),
      ...(showDebugInfo ? { stack: formatStack(error.stack) } : {}),
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: showDebugInfo ? error.message : "Internal Server Error",
    ...(showDebugInfo ? { stack: formatStack(error.stack) } : {}),
  });
};
