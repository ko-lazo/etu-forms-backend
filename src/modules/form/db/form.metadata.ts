import { type RepositoryMetadata } from "@/core/repositories/repository.metadata.js";
import { type Form, type FormCreate, type FormUpdate } from "../form.types.js";

export const formMetadata = {
  tableName: "forms",

  primaryKey: "id",

  defaultOrder: {
    column: "createdAt",
    direction: "DESC",
  },

  columns: {
    id: "id",
    userId: "user_id",
    title: "title",
    schema: "schema",
    settings: "settings",
    publishedAt: "published_at",
    archivedAt: "archived_at",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },

  creatableColumns: ["userId", "title", "schema", "settings"],

  updatableColumns: ["title", "schema", "settings"],

  jsonColumns: ["schema", "settings"],
} satisfies RepositoryMetadata<Form, FormCreate, FormUpdate>;
