import { type NextFunction, type Request, type Response } from "express";

import { type IAuthTokenValidator } from "@/shared/http/auth-service.interface.js";

export function createAuthMiddleware(tokenValidator: IAuthTokenValidator) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ message: "Missing or invalid authorization header" });
      return;
    }

    const plainToken = authHeader.split(" ")[1];

    if (!plainToken) {
      res.status(401).json({ message: "Token not provided" });
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

export type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;
