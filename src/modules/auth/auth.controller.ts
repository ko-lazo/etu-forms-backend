import type { Request, Response } from "express";
import { toIssuedApiTokenResponse } from "@/modules/api-token/index.js";
import { userMapper } from "@/modules/user/index.js";
import { requireUser } from "@/shared/http/authorize.js";
import { type LoginDto } from "./auth.dto.js";
import { type AuthService } from "./auth.service.js";

export function createAuthController(authService: AuthService) {
  async function login(req: Request, res: Response): Promise<void> {
    const issued = await authService.login(req.body as LoginDto);
    res.status(200).json(toIssuedApiTokenResponse(issued));
  }

  async function me(req: Request, res: Response): Promise<void> {
    const user = await authService.getMe(requireUser(req));
    res.status(200).json(userMapper.toResponse(user));
  }

  return { login, me };
}

export type AuthController = ReturnType<typeof createAuthController>;
