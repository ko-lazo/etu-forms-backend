import type { Request } from "express";

import { ForbiddenError } from "@/shared/errors/forbidden.error.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";

export function ensureAllowed(
  userId: string | undefined,
  allowed: boolean,
): void {
  if (allowed) return;

  throw userId === undefined ? new UnauthorizedError() : new ForbiddenError();
}

export function requireUser(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  return req.user.id;
}
