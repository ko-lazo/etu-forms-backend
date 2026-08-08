import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

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

    if (
      result.data &&
      typeof result.data === "object" &&
      Object.keys(result.data).length === 0
    ) {
      res.status(400).json({
        message: "Validation failed",
        errors: [
          {
            code: "custom",
            message:
              "The request body is empty or does not contain any fields allowed for this operation",
          },
        ],
      });
      return;
    }

    req.body = result.data;

    next();
  };
}
