import type { Request, Response } from "express";
import { pipeline } from "node:stream/promises";

import {
  createReadHandlers,
  type Handler,
} from "@/core/controllers/resource-handlers.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import type { IFileStorage } from "@/core/storage/file-storage.interface.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import { ensureAllowed, requireUser } from "@/shared/http/authorize.js";
import { getValidatedQuery } from "@/shared/http/http.params.js";
import { logger, serializeError } from "@/shared/logger/logger.js";

import { JobFilter } from "../db/job.filter.js";
import { JobScope } from "../db/job.scope.js";
import { readArtifact } from "../job.domain.js";
import type { JobPolicy } from "../job.policy.js";
import type { JobService } from "../job.service.js";
import type { Job, JobArtifact } from "../job.types.js";
import type { FindJobDto } from "./job.dto.js";
import { jobMapper } from "./job.mapper.js";
import { JOB_STATUS } from "../job.types.js";

export function createJobController(
  service: JobService,
  policy: JobPolicy,
  storage: IFileStorage,
) {
  const { findOrFail, ...read } = createReadHandlers({
    service,
    policy,
    mapper: jobMapper,

    buildFindContext: (req) => {
      const query = getValidatedQuery<FindJobDto>(req);

      return {
        scope: new JobScope(requireUser(req)),
        filter: new JobFilter(query),
        pagination: new BasePagination(query),
      };
    },
  });

  const findOwned = async (req: Request): Promise<Job> => {
    const job = await findOrFail(req);

    ensureAllowed(req.user?.id, await policy.view(req.user?.id, job));

    return job;
  };

  const streamArtifact = async (
    job: Job,
    key: string,
    res: Response,
  ): Promise<void> => {
    try {
      await pipeline(storage.createReadStream(key), res);
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

  const cancel: Handler = async (req, res) => {
    const job = await findOwned(req);

    const cancelled = await service.requestCancel(job.id);

    res.status(200).json(jobMapper.toResponse(cancelled));
  };

  const download: Handler = async (req, res) => {
    const job = await findOwned(req);
    const artifact = resolveReadyArtifact(job);

    const stored = await storage.stat(artifact.key);

    if (!stored) {
      throw new NotFoundError("Файл результата отсутствует в хранилище");
    }

    res.setHeader("Content-Type", artifact.mimeType);
    res.setHeader("Content-Length", stored.size);
    res.setHeader(
      "Content-Disposition",
      buildContentDisposition(artifact.name),
    );

    await streamArtifact(job, artifact.key, res);
  };

  return { ...read, cancel, download };
}

function resolveReadyArtifact(job: Job): JobArtifact {
  if (job.status !== JOB_STATUS.SUCCEEDED) {
    throw new BadRequestError("Результат задачи ещё не готов");
  }

  const artifact = readArtifact(job.result);

  if (!artifact) {
    throw new NotFoundError("У задачи нет файла-результата");
  }

  return artifact;
}

function buildContentDisposition(name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export type JobController = ReturnType<typeof createJobController>;
