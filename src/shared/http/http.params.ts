import type { Request } from "express";
import { BadRequestError } from "../errors/bad-request.error";

export function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new BadRequestError(`Route parameter "${name}" is required`);
  }

  return value;
}
