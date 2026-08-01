import { Request, Response } from "express";
import { NextFunction } from "express";
import { IAuthTokenValidator } from "@/shared/http/auth-service.interface.js";

export class AuthMiddleware {
  constructor(private readonly tokenValidator: IAuthTokenValidator) {}

  public handle = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
          .status(401)
          .json({ message: "Missing or invalid authorization header" });
        return;
      }

      const parts = authHeader.split(" ");
      const plainToken = parts[1];

      if (!plainToken) {
        res.status(401).json({ message: "Token not provided" });
        return;
      }

      const result = await this.tokenValidator.validateToken(plainToken);

      if (!result) {
        res
          .status(401)
          .json({ message: "Invalid, expired or revoked API token" });
        return;
      }

      req.user = {
        id: result.userId,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
