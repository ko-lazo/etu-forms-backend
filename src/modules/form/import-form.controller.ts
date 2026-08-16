import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Request, Response } from "express";
import { z } from "zod";

import type { IFileStorage } from "@/core/storage/file-storage.interface.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { UnauthorizedError } from "@/shared/errors/unauthorized.error.js";
import { jobMapper, type JobService } from "@/modules/job/index.js";
import { IMPORT_FORM_JOB_TYPE } from "./handlers/import-form.handler.js";

const titleSchema = z.string().trim().min(1).max(500);

export class ImportFormController {
  constructor(
    private readonly storage: IFileStorage,
    private readonly jobService: JobService,
  ) {}

  create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const file = req.file;

    if (!file) {
      throw new BadRequestError('Файл не передан: ожидается поле "file"');
    }

    const title = this.resolveTitle(req, file.originalname);

    const fileHash = createHash("sha256").update(file.buffer).digest("hex");
    const fileKey = `imports/${req.user.id}/${fileHash}.csv`;

    const output = await this.storage.createWriteStream(fileKey);
    await pipeline(Readable.from(file.buffer), output);

    const payload = { fileKey, title };

    const idempotencyKey = req.header("Idempotency-Key");

    const job = await this.jobService.enqueue({
      type: IMPORT_FORM_JOB_TYPE,
      userId: req.user.id,
      payload,
      ...(idempotencyKey
        ? {
            idempotencyKey: `${IMPORT_FORM_JOB_TYPE}:${req.user.id}:${idempotencyKey}`,
          }
        : {}),
    });

    res.status(202).json(jobMapper.toResponse(job));
  };

  private resolveTitle(req: Request, originalName: string): string {
    const raw =
      typeof req.body?.title === "string" && req.body.title.trim().length > 0
        ? req.body.title
        : originalName.replace(/\.csv$/i, "");

    const parsed = titleSchema.safeParse(raw);

    if (!parsed.success) {
      throw new BadRequestError(
        "Некорректное название формы",
        z.treeifyError(parsed.error),
      );
    }

    return parsed.data;
  }
}
