import { FormSchemaDto } from "./schema/form-schema.schema.js";

export interface Form {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly schema: FormSchemaDto;
  readonly settings: Record<string, unknown>;
  readonly publishedAt: Date | null;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateFormInput {
  readonly userId: string;
  readonly title: string;
  readonly schema?: FormSchemaDto;
  readonly settings?: Record<string, unknown>;
}

export interface UpdateFormInput {
  readonly title?: string;
  readonly schema?: FormSchemaDto;
  readonly settings?: Record<string, unknown>;
}
