import type { NextFunction, Request, Response } from "express";
import multer, { MulterError } from "multer";

import { storageConfig } from "@/config/index.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: storageConfig.uploadMaxSizeBytes,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (!isCsv) {
      callback(new BadRequestError("Ожидается файл в формате CSV"));
      return;
    }

    callback(null, true);
  },
}).single("file");

export function uploadCsv(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  csvUpload(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? `Файл больше допустимых ${storageConfig.uploadMaxSizeBytes / (1024 * 1024)} МБ`
          : `Ошибка загрузки файла: ${error.message}`;

      next(new BadRequestError(message));
      return;
    }

    next(error);
  });
}
