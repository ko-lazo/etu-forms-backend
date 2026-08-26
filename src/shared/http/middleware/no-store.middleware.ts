import type { RequestHandler } from "express";

export const noStoreMiddleware: RequestHandler = (_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
};
