import { z } from "zod";
import { createFindSchema, ModuleDto } from "@/core/dto/dto.types.js";
import { JOB_STATUSES, JOB_TYPES } from "./job.types.js";

const jobTypeSchema = z.enum([
  JOB_TYPES.formResponsesExport,
  JOB_TYPES.formImport,
]);

const jobErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

const jobResultSchema = z
  .object({
    artifact: z
      .object({
        name: z.string(),
        size: z.number().int().nonnegative(),
        mimeType: z.string(),
      })
      .optional(),
    formId: z.uuid().optional(),
    rowCount: z.number().int().nonnegative().optional(),
    elementsCount: z.number().int().nonnegative().optional(),
  })
  .nullable();

const enqueueSchema = z.object({
  type: jobTypeSchema,
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const jobDto = {
  createSchema: enqueueSchema,

  updateSchema: enqueueSchema,

  responseSchema: z.object({
    id: z.uuid(),
    type: jobTypeSchema,
    status: z.enum(JOB_STATUSES),

    progress: z.number().int().min(0).max(100).nullable(),
    processedCount: z.number().int().nonnegative(),
    totalCount: z.number().int().nonnegative().nullable(),

    result: jobResultSchema,
    error: jobErrorSchema.nullable(),

    createdAt: z.date(),
    startedAt: z.date().nullable(),
    finishedAt: z.date().nullable(),
  }),

  findSchema: createFindSchema({
    status: z.enum(JOB_STATUSES).optional(),
    type: jobTypeSchema.optional(),
  }),
} satisfies ModuleDto<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>;

export type CreateJobDto = z.infer<typeof jobDto.createSchema>;
export type JobResponseDto = z.infer<typeof jobDto.responseSchema>;
export type FindJobDto = z.infer<typeof jobDto.findSchema>;
