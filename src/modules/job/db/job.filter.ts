import { BaseFilter } from "@/core/repositories/base.filter.js";
import { type Job } from "../job.types.js";
import { type FindJobDto } from "../api/job.dto.js";
import { jobMetadata } from "./job.metadata.js";

export class JobFilter extends BaseFilter<Job> {
  constructor(query: FindJobDto) {
    super(jobMetadata);

    if (query.status) this.status(query.status);

    if (query.type) this.type(query.type);

    if (query.formId) this.formId(query.formId);

    this.dateRange("createdAt", query.createdFrom, query.createdTo);
  }

  private status(value: string): void {
    this.add(`${this.col("status")} = ?`, value);
  }

  private type(value: string): void {
    this.add(`${this.col("type")} = ?`, value);
  }

  private formId(value: string): void {
    this.add(`${this.col("payload")} ->> 'formId' = ?`, value);
  }
}
