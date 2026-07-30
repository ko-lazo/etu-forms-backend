import { RepositoryMetadata } from "@/core/repositories/repository.metadata.js";
import { User } from "./user.types.js";
import { CreateUserDto, UpdateUserDto } from "@/modules/user/user.dto.js";

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
} satisfies RepositoryMetadata<User, CreateUserDto, UpdateUserDto>;
