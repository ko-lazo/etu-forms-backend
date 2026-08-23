import type { Request } from "express";
import rateLimit, {
  ipKeyGenerator,
  type Options,
  type RateLimitRequestHandler,
} from "express-rate-limit";

import { TooManyRequestsError } from "@/shared/errors/too-many-requests.error.js";

const WINDOW_MS = 60 * 1000;

const userOrIpKey = (request: Request) =>
  request.user?.id ?? ipKeyGenerator(request.ip ?? "");

function createRateLimit(options: Partial<Options>): RateLimitRequestHandler {
  return rateLimit({
    windowMs: WINDOW_MS,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(new TooManyRequestsError());
    },
    ...options,
  });
}

export const apiRateLimit = createRateLimit({
  limit: 600,
});

export const loginRateLimit = createRateLimit({ limit: 5 });

export const formResponseLimit = createRateLimit({
  limit: 120,
  keyGenerator: userOrIpKey,
});

/** Экспорт ответов на форму */
export const exportRateLimit = createRateLimit({
  limit: 10,
  keyGenerator: userOrIpKey,
});
