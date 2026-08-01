import { RepositoryMetadata } from "@/core/repositories/repository.metadata.js";
import { User, UserCreate, UserUpdate } from "./user.types.js";

export const userMetadata = {
  tableName: "users",

  primaryKey: "id",

  columns: {
    id: "id",
    email: "email",
    password: "password",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },

  creatableColumns: ["email", "password"],

  updatableColumns: ["email"],
} satisfies RepositoryMetadata<User, UserCreate, UserUpdate>;
