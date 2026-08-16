import { BaseScope } from "@/core/repositories/base.scope.js";
import { type Job } from "../job.types.js";
import { jobMetadata } from "./job.metadata.js";

export class JobScope extends BaseScope<Job> {
  constructor(userId: string) {
    super(jobMetadata);

    this.add(`${this.col("userId")} = ?`, userId);
  }
}
