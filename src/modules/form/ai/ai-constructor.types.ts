import { z } from "zod";
import { formSchemaObject } from "@/modules/form/index.js";

export const aiResponseSchema = z.object({
  status: z.enum(["ok", "unsupported", "ambiguous"]),
  message: z.string(),
  form: formSchemaObject.optional(),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;
