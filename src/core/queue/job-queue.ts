import { Queue } from "bullmq";

import { jobConfig } from "@/config/index.js";
import { createRedisConnection } from "./connection.js";

export type JobQueueData = {
  readonly jobId: string;
};

const connection = createRedisConnection();

export const jobQueue = new Queue<JobQueueData>(jobConfig.queueName, {
  connection,
  defaultJobOptions: {
    attempts: jobConfig.maxAttempts,
    backoff: { type: "exponential", delay: jobConfig.backoffDelayMs },
    removeOnComplete: {
      age: jobConfig.removeOnCompleteAgeSec,
      count: jobConfig.removeOnCompleteCount,
    },
    removeOnFail: { age: jobConfig.removeOnFailAgeSec },
  },
});

export async function closeJobQueue(): Promise<void> {
  await jobQueue.close();
}
