import type { Request, Response } from "express";

import { AuthService } from "./auth.service.js";
import { LoginDto } from "./auth.dto.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const dto: LoginDto = req.body;
    const result = await this.authService.login(dto);

    res.status(200).json(result);
  };
}
