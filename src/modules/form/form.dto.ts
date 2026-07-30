import { z } from "zod";
import { ModuleDto } from "@/core/dto/dto.types.js";
import { formSchemaObject } from "./schema/form-schema.schema.js";

export const formDto = {
  createSchema: z.object({
    userId: z.uuid(),
    title: z.string().trim().min(1).max(500),
    schema: formSchemaObject,
    settings: z.record(z.string(), z.unknown()).default({}),
  }),

  updateSchema: z.object({
    title: z.string().trim().min(1).max(500),
    schema: formSchemaObject,
    settings: z.record(z.string(), z.unknown()).default({}),
  }),

  responseSchema: z.object({
    id: z.uuid(),
    userId: z.uuid(),
    title: z.string().trim().min(1).max(500),
    schema: formSchemaObject,
    settings: z.record(z.string(), z.unknown()).default({}),
    publishedAt: z.date(),
    archivedAt: z.date(),
    createdAt: z.date(),
  }),
} satisfies ModuleDto<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>;

export type CreateFormDto = z.infer<typeof formDto.createSchema>;
export type UpdateFormDto = z.infer<typeof formDto.updateSchema>;
export type FormResponseDto = z.infer<typeof formDto.responseSchema>;
