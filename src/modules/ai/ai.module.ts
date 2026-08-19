import { aiConfig } from "@/config/index.js";
import { createRedisConnection } from "@/core/queue/connection.js";
import { createAiService } from "./ai.service.js";
import { createAiQuota } from "./ai.quota.js";
import { createAiController } from "./api/ai.controller.js";

export function createAiModule() {
  const redis = createRedisConnection();
  const quota = createAiQuota(redis, aiConfig);

  return {
    service: createAiService(aiConfig),
    quota,
    controller: createAiController(quota),
    close: async (): Promise<void> => {
      await redis.quit();
    },
  };
}
