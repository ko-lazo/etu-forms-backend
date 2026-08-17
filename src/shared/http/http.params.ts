import type { Request } from "express";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";

export function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new BadRequestError(`Route parameter "${name}" is required`);
  }

  return value;
}

/**
 * Возвращает валидные query-параметры запроса.
 * Выбрасывает ошибку, если для данного маршрута не был вызван middleware валидации.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getValidatedQuery<T>(req: Request): T {
  if (req.validatedQuery === undefined) {
    throw new Error(
      `Query parameters were not validated: add validate(schema, "query") to ${req.method} ${req.baseUrl}${req.path}`,
    );
  }

  return req.validatedQuery as T;
}
