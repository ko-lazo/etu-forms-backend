import { z } from "zod";
import { ModuleDto } from "@/core/dto/dto.types.js";

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
} satisfies ModuleDto<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>;

export type CreateApiTokenDto = z.infer<typeof apiTokenDto.createSchema>;
export type UpdateApiTokenDto = z.infer<typeof apiTokenDto.updateSchema>;
export type ApiTokenResponseDto = z.infer<typeof apiTokenDto.responseSchema>;
