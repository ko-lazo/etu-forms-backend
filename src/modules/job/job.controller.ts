import type { Request, Response } from "express";
import { pipeline } from "node:stream/promises";

import { BaseController } from "@/core/controllers/base.controller.js";
import { FindContext } from "@/core/repositories/repository.interface.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import type { IFileStorage } from "@/core/storage/file-storage.interface.js";
import { getRouteParam } from "@/shared/http/http.params.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { ForbiddenError } from "@/shared/errors/forbidden.error.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { logger, serializeError } from "@/shared/logger/logger.js";

import type { JobService } from "./job.service.js";
import type { JobPolicy } from "./job.policy.js";
import { jobMapper } from "./job.mapper.js";
import { JobScope } from "./job.scope.js";
import { JobFilter } from "./job.filter.js";
import { readArtifact } from "./job.artifact.js";
import type { Job, JobCreate, JobUpdate } from "./job.types.js";
import type { FindJobDto, JobResponseDto } from "./job.dto.js";

export class JobController extends BaseController<
  Job,
  JobCreate,
  JobUpdate,
  JobResponseDto
> {
  constructor(
    private readonly jobService: JobService,
    private readonly jobPolicy: JobPolicy,
    private readonly storage: IFileStorage,
  ) {
    super(jobService, jobPolicy, jobMapper);
  }

  protected override getFindAllOptions(req: Request): FindContext<Job> {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const dto = req.query as unknown as FindJobDto;

    return {
      scope: new JobScope(req.user.id),
      filter: new JobFilter(dto),
      pagination: new BasePagination(dto),
    };
  }

  cancel = async (req: Request, res: Response): Promise<void> => {
    const job = await this.findOwned(req);

    const cancelled = await this.jobService.requestCancel(job.id);

    res.status(200).json(jobMapper.toResponse(cancelled));
  };

  download = async (req: Request, res: Response): Promise<void> => {
    const job = await this.findOwned(req);

    if (job.status !== "succeeded") {
      throw new BadRequestError("Результат задачи ещё не готов");
    }

    const artifact = readArtifact(job.result);

    if (!artifact) {
      throw new NotFoundError("У задачи нет файла-результата");
    }

    const stored = await this.storage.stat(artifact.key);

    if (!stored) {
      throw new NotFoundError("Файл результата отсутствует в хранилище");
    }

    res.setHeader("Content-Type", artifact.mimeType);
    res.setHeader("Content-Length", stored.size);
    res.setHeader("Content-Disposition", contentDisposition(artifact.name));

    try {
      await pipeline(this.storage.createReadStream(artifact.key), res);
    } catch (error) {
      logger.error(
        {
          jobId: job.id,
          ...serializeError(error),
        },
        "Не удалось отдать файл задачи",
      );

      if (!res.headersSent) throw error;

      res.destroy();
    }
  };

  private async findOwned(req: Request): Promise<Job> {
    const id = getRouteParam(req, "id");
    const job = await this.jobService.findById(id);

    if (!job) {
      throw new NotFoundError("Задача не найдена");
    }

    if (!req.user) {
      throw new UnauthorizedError();
    }

    if (!this.jobPolicy.view(req.user.id, job)) {
      throw new ForbiddenError();
    }

    return job;
  }
}

function contentDisposition(name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
