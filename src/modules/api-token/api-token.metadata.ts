import { RepositoryMetadata } from "@/core/repositories/repository.metadata.js";

import { ApiToken, ApiTokenCreate, ApiTokenUpdate } from "./api-token.types.js";

export const apiTokenMetadata = {
  tableName: "api_tokens",

  primaryKey: "id",

  defaultOrder: {
    column: "createdAt",
    direction: "DESC",
  },

  columns: {
    id: "id",
    userId: "user_id",
    name: "name",
    token: "token",
    lastUsedAt: "last_used_at",
    expiresAt: "expires_at",
    createdAt: "created_at",
  },

  creatableColumns: ["name", "token", "userId", "expiresAt"],

  updatableColumns: ["name"],
} satisfies RepositoryMetadata<ApiToken, ApiTokenCreate, ApiTokenUpdate>;
