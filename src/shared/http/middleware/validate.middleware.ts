import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { BadRequestError } from "@/shared/errors/bad-request.error.js";

export type ValidationSource = "body" | "query";

/**
 * Валидация входящих данных запроса (body или query) через zod-схему.
 * Проверенные валидацией query-параметры сохраняются в `req.validatedQuery`.
 */
export function validate<T>(
  schema: ZodType<T>,
  source: ValidationSource = "body",
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const input: unknown = source === "body" ? req.body : req.query;
    const result = schema.safeParse(input);

    if (!result.success) {
      next(new BadRequestError("Validation failed", result.error.issues));
      return;
    }

    if (source === "query") {
      req.validatedQuery = result.data;
      next();
      return;
    }

    if (isEmptyObject(result.data)) {
      next(
        new BadRequestError("Validation failed", [
          {
            code: "custom",
            message:
              "The request body is empty or does not contain any fields allowed for this operation",
          },
        ]),
      );
      return;
    }

    req.body = result.data;

    next();
  };
}

function isEmptyObject(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).length === 0
  );
}
