import { z } from "zod";
import { formSchemaObject } from './schema/form-schema.schema.js';

export const createFormSchema = z.object({
  title: z.string().trim().min(1).max(500),
  schema: formSchemaObject,
  settings: z.record(z.string(), z.unknown()).default({}),
});
