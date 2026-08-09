import type { Request, Response } from "express";

import { AuthService } from "./auth.service.js";
import { LoginDto } from "./auth.dto.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { userMapper } from "@/modules/user/user.mapper.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const dto: LoginDto = req.body;
    const result = await this.authService.login(dto);

    res.status(200).json(result);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await this.authService.getMe(req.user.id);
    res.status(200).json(userMapper.toResponse(user));
  };
}
