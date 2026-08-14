import { Redis } from "ioredis";

import { jobConfig } from "@/config/index.js";

/**
 * Соединение с Redis для BullMQ.
 *
 * @remarks
 * `maxRetriesPerRequest: null` продолжает держать соединение без
 * появления новых задач в очереди
 */
export function createRedisConnection(): Redis {
  return new Redis(jobConfig.redisUrl, { maxRetriesPerRequest: null });
}
