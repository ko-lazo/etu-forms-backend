import { z } from "zod";
import { createFindSchema, type ModuleDto } from "@/core/dto/dto.types.js";
import { formElementNameSchema } from "@/modules/form/index.js";
import type { FormResponseAnswer } from "../form-response.types.js";

const elementNameListSchema = z
  .union([formElementNameSchema, z.array(formElementNameSchema).min(1)])
  .transform((value) => (Array.isArray(value) ? value : [value]));

const answerSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]) satisfies z.ZodType<FormResponseAnswer>;

export const formResponseDto = {
  createSchema: z.object({
    answers: z.record(z.string(), answerSchema),
    metadata: z.record(z.string(), z.unknown()).default({}),
    submittedAt: z.coerce.date().nullable().optional(),
  }),

  updateSchema: z
    .object({
      answers: z.record(z.string(), answerSchema),
      metadata: z.record(z.string(), z.unknown()),
      submittedAt: z.coerce.date().nullable(),
    })
    .partial(),

  responseSchema: z.object({
    id: z.uuid(),
    formId: z.uuid(),
    answers: z.record(z.string(), answerSchema),
    metadata: z.record(z.string(), z.unknown()),
    submittedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  findSchema: createFindSchema({
    formId: z.uuid().optional(),

    answer: z
      .record(formElementNameSchema, z.string().trim().min(1).max(500))
      .optional(),
    answered: elementNameListSchema.optional(),

    submitted: z.stringbool().optional(),
    submittedFrom: z.coerce.date().optional(),
    submittedTo: z.coerce.date().optional(),
  }),
} satisfies ModuleDto<z.ZodType, z.ZodType, z.ZodType>;

export type CreateFormResponseDto = z.infer<
  typeof formResponseDto.createSchema
>;

export type UpdateFormResponseDto = z.infer<
  typeof formResponseDto.updateSchema
>;

export type FormResponseDto = z.infer<typeof formResponseDto.responseSchema>;

export type FindFormResponseDto = z.infer<typeof formResponseDto.findSchema>;
