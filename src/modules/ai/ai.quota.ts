import type { Redis } from "ioredis";
import { TooManyRequestsError } from "@/shared/errors/too-many-requests.error.js";

export type AiQuotaState = {
  readonly limit: number;
  readonly used: number;
  readonly remaining: number;
  readonly resetAt: Date;
};

export type AiQuota = {
  getStatistics(userId: string): Promise<AiQuotaState>;
  /** Бросает TooManyRequests, если суточный лимит исчерпан */
  ensureAvailable(userId: string): Promise<void>;
  spend(userId: string): Promise<void>;
};

export type AiQuotaConfig = {
  readonly dailyLimit: number;
};

export function createAiQuota(redis: Redis, config: AiQuotaConfig): AiQuota {
  async function getStatistics(userId: string): Promise<AiQuotaState> {
    const used = Number((await redis.get(getQuotaRedisKey(userId))) ?? 0);
    return buildState(config.dailyLimit, used);
  }

  async function ensureAvailable(userId: string): Promise<void> {
    const state = await getStatistics(userId);
    if (state.remaining > 0) return;
    throw new TooManyRequestsError("Суточный лимит запросов к ИИ исчерпан", {
      limit: state.limit,
      resetAt: state.resetAt,
    });
  }

  async function spend(userId: string): Promise<void> {
    const key = getQuotaRedisKey(userId);
    await redis
      .multi()
      .incr(key)
      .expireat(key, Math.ceil(getQuotaResetTime(new Date()).getTime() / 1000))
      .exec();
  }

  return {
    getStatistics,
    ensureAvailable,
    spend,
  };
}

function buildState(limit: number, used: number): AiQuotaState {
  return {
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    resetAt: getQuotaResetTime(new Date()),
  };
}

function getQuotaRedisKey(userId: string): string {
  return `ai:quota:${userId}:${new Date().toLocaleDateString("sv")}`;
}

function getQuotaResetTime(now: Date): Date {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next;
}
