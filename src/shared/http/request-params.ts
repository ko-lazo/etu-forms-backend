import type { Request } from "express";

import { NotFoundError } from "../errors/not-found.error";

export function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string") {
    throw new NotFoundError(`Route parameter "${name}" not found`);
  }

  return value;
}
