import { type IMapper } from "@/core/dto/mapper.interface.js";
import { computeProgress } from "../job.domain.js";
import { type Job } from "../job.types.js";
import { jobDto, type JobResponseDto } from "./job.dto.js";

export const jobMapper: IMapper<Job, JobResponseDto> = {
  toResponse(job: Job): JobResponseDto {
    return jobDto.responseSchema.parse({
      id: job.id,
      type: job.type,
      status: job.status,

      progress: computeProgress(job),
      processedCount: job.processedCount,
      totalCount: job.totalCount,

      result: job.result,
      error: job.error,

      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    });
  },

  toResponseCollection(jobs: Job[]): JobResponseDto[] {
    return jobs.map((job) => this.toResponse(job));
  },
};
