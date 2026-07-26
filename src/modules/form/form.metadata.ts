import { RepositoryMetadata } from '@/core/repositories/repository.metadata.js';
import { CreateFormInput, Form, UpdateFormInput } from './form.types.js';

export const formMetadata = {
  tableName: "forms",

  primaryKey: "id",

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
} satisfies RepositoryMetadata<Form, CreateFormInput, UpdateFormInput>;
