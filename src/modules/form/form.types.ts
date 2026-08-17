import { type FormSchema } from "./schema/form-schema.schema.js";

export interface Form {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly schema: FormSchema;
  readonly settings: Record<string, unknown>;
  readonly publishedAt: Date | null;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type FormCreate = Pick<Form, "userId" | "title" | "schema" | "settings">;
export type FormUpdate = Partial<
  Pick<Form, "title" | "schema" | "settings" | "publishedAt" | "archivedAt">
>;
