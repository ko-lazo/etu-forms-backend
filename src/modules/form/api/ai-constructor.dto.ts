import { z } from "zod";

export const aiConstructorDto = {
  generateSchema: z.object({
    prompt: z.string().trim().min(1).max(5000),
  }),
};

export type GenerateFormDto = z.infer<typeof aiConstructorDto.generateSchema>;
