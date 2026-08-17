import { type IReadPolicy } from "@/core/policies/policy.interface.js";
import { type Job } from "./job.types.js";

export function createJobPolicy(): IReadPolicy<Job> {
  return {
    view: (userId, job) => userId !== undefined && job.userId === userId,
  };
}

export type JobPolicy = ReturnType<typeof createJobPolicy>;
