import { RepositoryMetadata } from "@/core/repositories/repository.metadata.js";
import {
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate,
} from "../form-response.types.js";

export const formResponseMetadata = {
  tableName: "form_responses",

  primaryKey: "id",

  defaultOrder: {
    column: "createdAt",
    direction: "DESC",
  },

  columns: {
    id: "id",
    formId: "form_id",
    answers: "answers",
    metadata: "metadata",
    submittedAt: "submitted_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },

  creatableColumns: ["formId", "answers", "metadata", "submittedAt"],

  updatableColumns: ["answers", "metadata", "submittedAt"],

  jsonColumns: ["answers", "metadata"],
} satisfies RepositoryMetadata<
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate
>;
