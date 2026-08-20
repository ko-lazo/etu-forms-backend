import { z } from "zod";
import { createFindSchema, type ModuleDto } from "@/core/dto/dto.types.js";
import { formSchemaObject } from "@/modules/form/index.js";
import { FORM_STATUS } from "../form.domain.js";

export const formDto = {
  createSchema: z.object({
    title: z.string().trim().min(1).max(500),
    schema: formSchemaObject,
    settings: z.record(z.string(), z.unknown()).default({}),
  }),

  updateSchema: z.object({
    title: z.string().trim().min(1).max(500),
    schema: formSchemaObject,
    settings: z.record(z.string(), z.unknown()),
  }),

  responseSchema: z.object({
    id: z.uuid(),
    userId: z.uuid(),
    title: z.string().trim().min(1).max(500),
    schema: formSchemaObject,
    settings: z.record(z.string(), z.unknown()).default({}),

    status: z.enum(FORM_STATUS),
    isPublic: z.boolean(),

    publishedAt: z.date().nullable(),
    archivedAt: z.date().nullable(),
    createdAt: z.date(),
  }),

  findSchema: createFindSchema({
    title: z.string().trim().min(1).max(500).optional(),
    status: z.enum(FORM_STATUS).optional(),
    createdFrom: z.coerce.date().optional(),
    createdTo: z.coerce.date().optional(),
  }),
} satisfies ModuleDto<z.ZodType, z.ZodType, z.ZodType>;

export const formLifecycleSchema = z.object({
  date: z.coerce.date().optional(),
});

export type FormLifecycleDto = z.infer<typeof formLifecycleSchema>;

export type CreateFormDto = z.infer<typeof formDto.createSchema>;
export type UpdateFormDto = z.infer<typeof formDto.updateSchema>;
export type FormResponseDto = z.infer<typeof formDto.responseSchema>;
export type FindFormDto = z.infer<typeof formDto.findSchema>;
