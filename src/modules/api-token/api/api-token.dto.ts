import { z } from "zod";
import { createFindSchema, type ModuleDto } from "@/core/dto/dto.types.js";

export const apiTokenDto = {
  createSchema: z.object({
    name: z.string().min(1).max(100),
    expiresAt: z.date().nullable().optional(),
  }),

  updateSchema: z.object({
    name: z.string().min(1).max(100).optional(),
    expiresAt: z.date().nullable().optional(),
  }),

  responseSchema: z.object({
    id: z.uuid(),
    name: z.string(),
    lastUsedAt: z.date().nullable(),
    expiresAt: z.date().nullable(),
    createdAt: z.date(),
  }),

  findSchema: createFindSchema(),
} satisfies ModuleDto<z.ZodType, z.ZodType, z.ZodType>;

export const issuedApiTokenSchema = apiTokenDto.responseSchema.extend({
  token: z.string(),
});

export type CreateApiTokenDto = z.infer<typeof apiTokenDto.createSchema>;
export type UpdateApiTokenDto = z.infer<typeof apiTokenDto.updateSchema>;
export type ApiTokenResponseDto = z.infer<typeof apiTokenDto.responseSchema>;
export type FindApiTokenDto = z.infer<typeof apiTokenDto.findSchema>;
export type IssuedApiTokenDto = z.infer<typeof issuedApiTokenSchema>;
