import { type Request, type Response, type NextFunction } from "express";
import { type IAuthTokenValidator } from "@/shared/http/auth-service.interface.js";

export class OptionalAuthMiddleware {
  constructor(private readonly tokenValidator: IAuthTokenValidator) {}

  public handle = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next();
        return;
      }

      const parts = authHeader.split(" ");
      const plainToken = parts[1];

      if (!plainToken) {
        res.status(401).json({ message: "Malformed authorization header" });
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
