import { BaseFilter } from "@/core/repositories/base.filter.js";
import { Job } from "@/modules/job/job.types.js";
import { FindJobDto } from "@/modules/job/job.dto.js";
import { jobMetadata } from "@/modules/job/job.metadata.js";

export class JobFilter extends BaseFilter<Job> {
  constructor(query: FindJobDto) {
    super(jobMetadata);

    if (query.status) {
      this.status(query.status);
    }

    if (query.type) {
      this.type(query.type);
    }
  }

  private status(value: string): void {
    this.add(`${this.col("status")} = ?`, value);
  }

  private type(value: string): void {
    this.add(`${this.col("type")} = ?`, value);
  }
}
