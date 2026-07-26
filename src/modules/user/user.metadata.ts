import { RepositoryMetadata } from "../../core/repositories/repository.metadata";
import { CreateUserInput, UpdateUserInput, User } from "./user.types";

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

  updatableColumns: [],
} satisfies RepositoryMetadata<User, CreateUserInput, UpdateUserInput>;
