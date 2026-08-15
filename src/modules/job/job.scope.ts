import { BaseScope } from "@/core/repositories/base.scope.js";
import { Job } from "@/modules/job/job.types.js";
import { jobMetadata } from "@/modules/job/job.metadata.js";

export class JobScope extends BaseScope<Job> {
  constructor(userId: string) {
    super(jobMetadata);

    this.add(`${this.col("userId")} = ?`, userId);
  }
}
