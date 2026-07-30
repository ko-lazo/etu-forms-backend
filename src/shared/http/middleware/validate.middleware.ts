import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Универсальный middleware валидации.
 * <T> позволяет TypeScript понять, какой тип данных окажется в req.body после валидации.
 */
export function validate<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues,
      });
      return;
    }

    req.body = result.data;

    next();
  };
}
