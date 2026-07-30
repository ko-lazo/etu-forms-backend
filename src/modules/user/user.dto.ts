import { z } from "zod";
import { ModuleDto } from "@/core/dto/dto.types.js";

export const userDto = {
  createSchema: z.object({
    email: z.email(),
    password: z.string().min(8),
  }),

  updateSchema: z.object({
    email: z.email().optional(),
  }),

  responseSchema: z.object({
    id: z.uuid(),
    email: z.email(),
    createdAt: z.date(),
  }),
} satisfies ModuleDto<z.ZodTypeAny, z.ZodTypeAny, z.ZodTypeAny>;

export type CreateUserDto = z.infer<typeof userDto.createSchema>;
export type UpdateUserDto = z.infer<typeof userDto.updateSchema>;
export type UserResponseDto = z.infer<typeof userDto.responseSchema>;
