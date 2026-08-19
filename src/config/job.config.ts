import { env } from "./env.js";

export const jobConfig = {
  redisUrl: env.REDIS_URL,

  /** Название очереди */
  queueName: "jobs",

  /** Кол-во параллельно выполняемых задач */
  concurrency: env.JOB_CONCURRENCY,

  /** Максимальное количество попыток выполнения задачи */
  maxAttempts: env.JOB_MAX_ATTEMPTS,
  /** Задержка перед повторным выполнением упавшей задачи */
  retryAfterMs: 2000,

  /** Частота обновления задачи в БД */
  syncIntervalMs: 1000,

  /** Удаление выполненных или упавших задач */
  removeOnCompleteAgeSec: 3600,
  removeOnCompleteCount: 1000,
  removeOnFailAgeSec: 86_400,
} as const;
