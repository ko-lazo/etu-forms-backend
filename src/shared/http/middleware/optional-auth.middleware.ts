import { type NextFunction, type Request, type Response } from "express";

import { type IAuthTokenValidator } from "@/shared/http/auth-service.interface.js";

export function createOptionalAuthMiddleware(
  tokenValidator: IAuthTokenValidator,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next();
      return;
    }

    const plainToken = authHeader.split(" ")[1];

    if (!plainToken) {
      res.status(401).json({ message: "Malformed authorization header" });
      return;
    }

    const result = await tokenValidator.validateToken(plainToken);

    if (!result) {
      res
        .status(401)
        .json({ message: "Invalid, expired or revoked API token" });
      return;
    }

    req.user = { id: result.userId };

    next();
  };
}

export type OptionalAuthMiddleware = ReturnType<
  typeof createOptionalAuthMiddleware
>;
