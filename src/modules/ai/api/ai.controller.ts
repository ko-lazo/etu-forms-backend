import type { Request, Response } from "express";

import { requireUser } from "@/shared/http/authorize.js";

import type { AiQuota } from "../ai.quota.js";

export function createAiController(quota: AiQuota) {
  async function limit(req: Request, res: Response): Promise<void> {
    const state = await quota.getState(requireUser(req));

    res.status(200).json({
      limit: state.limit,
      used: state.used,
      remaining: state.remaining,
      resetAt: state.resetAt.toISOString(),
    });
  }

  return {
    limit,
  };
}

export type AiController = ReturnType<typeof createAiController>;
