import { formSchemaObject } from "./form-schema.schema";
import { z } from "zod";

export const createFormRequestSchema = z.object({
  title: z.string().trim().min(1).max(500),
  schema: formSchemaObject,
  settings: z.record(z.string(), z.unknown()).default({}),
});
