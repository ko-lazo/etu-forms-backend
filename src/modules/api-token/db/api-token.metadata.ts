import { type RepositoryMetadata } from "@/core/repositories/repository.metadata.js";

import {
  type ApiToken,
  type ApiTokenCreate,
  type ApiTokenUpdate,
} from "../api-token.types.js";

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
    type: "type",
    token: "token",
    expiresAt: "expires_at",
    createdAt: "created_at",
  },

  creatableColumns: ["name", "type", "token", "userId", "expiresAt"],

  updatableColumns: ["name"],
} satisfies RepositoryMetadata<ApiToken, ApiTokenCreate, ApiTokenUpdate>;
