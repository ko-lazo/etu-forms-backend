import { z } from "zod";
import { createFindSchema, ModuleDto } from "@/core/dto/dto.types.js";
import type { FormResponseAnswer } from "../form-response.types.js";

/** Проверяет формат ответа на входе; сам тип объявлен в form-response.types.ts */
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

  updateSchema: z.object({
    answers: z.record(z.string(), answerSchema),
    metadata: z.record(z.string(), z.unknown()).default({}),
    submittedAt: z.coerce.date().nullable().optional(),
  }),

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
  }),
} satisfies ModuleDto<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>;

export type CreateFormResponseDto = z.infer<
  typeof formResponseDto.createSchema
>;

export type UpdateFormResponseDto = z.infer<
  typeof formResponseDto.updateSchema
>;

export type FormResponseDto = z.infer<typeof formResponseDto.responseSchema>;

export type FindFormResponseDto = z.infer<typeof formResponseDto.findSchema>;
