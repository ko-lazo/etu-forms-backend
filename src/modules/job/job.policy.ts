import { type IResourcePolicy } from "@/core/policies/policy.interface.js";
import { type Job } from "./job.types.js";

export class JobPolicy implements IResourcePolicy<Job> {
  view(userId: string | undefined, job: Job): boolean {
    return !!userId && job.userId === userId;
  }

  update(userId: string, job: Job): boolean {
    return job.userId === userId;
  }

  delete(userId: string, job: Job): boolean {
    return job.userId === userId;
  }
}

export const jobPolicy = new JobPolicy();
