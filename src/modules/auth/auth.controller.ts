import { type Handler } from "@/core/controllers/resource-handlers.js";
import { toIssuedApiTokenResponse } from "@/modules/api-token/index.js";
import { userMapper } from "@/modules/user/index.js";
import { requireUser } from "@/shared/http/authorize.js";

import { type LoginDto } from "./auth.dto.js";
import { type AuthService } from "./auth.service.js";

export function createAuthController(authService: AuthService) {
  const login: Handler = async (req, res) => {
    const issued = await authService.login(req.body as LoginDto);

    res.status(200).json(toIssuedApiTokenResponse(issued));
  };

  const me: Handler = async (req, res) => {
    const user = await authService.getMe(requireUser(req));

    res.status(200).json(userMapper.toResponse(user));
  };

  return { login, me };
}

export type AuthController = ReturnType<typeof createAuthController>;
