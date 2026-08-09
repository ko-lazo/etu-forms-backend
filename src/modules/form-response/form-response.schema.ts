import { z } from "zod";

export const formResponseAnswerSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);

export const formResponseSchema = z.object({
  formId: z.uuid(),

  answers: z.record(z.string(), formResponseAnswerSchema),

  metadata: z.record(z.string(), z.unknown()).default({}),

  submittedAt: z.coerce.date().nullable().optional(),
});

export type FormResponseSchemaDto = z.infer<typeof formResponseSchema>;
