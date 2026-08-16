import type { FormResponseDto } from "./form-response.dto.js";

export interface FormResponse {
  readonly id: string;
  readonly formId: string;
  readonly answers: FormResponseDto["answers"];
  readonly metadata: Record<string, unknown>;
  readonly submittedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type FormResponseCreate = Pick<
  FormResponse,
  "formId" | "answers" | "metadata" | "submittedAt"
>;

export type FormResponseUpdate = Pick<
  FormResponse,
  "answers" | "metadata" | "submittedAt"
>;

export type FormResponseExportRow = {
  readonly id: string;
  readonly answers: Record<string, unknown>;
  readonly createdAt: Date;
  readonly submittedAt: Date | null;
};
