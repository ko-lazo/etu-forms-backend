import type { RequestHandler } from "express";

import { NotFoundError } from "../../errors/not-found.error";

export const notFoundMiddleware: RequestHandler = (
  request,
  _response,
  next,
) => {
  // todo правильно ли так вообще с точки зрения архитектуры
  next(
    new NotFoundError(
      `Route ${request.method} ${request.originalUrl} not found`,
    ),
  );
};
