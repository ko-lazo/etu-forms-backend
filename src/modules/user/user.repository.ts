import { BaseRepository } from "../../core/repositories/base.repository";
import { userMetadata } from "./user.metadata";
import type { CreateUserInput, User, UpdateUserInput } from "./user.types";
import { DatabaseClient } from "../../core/database/database.client";

export class UserRepository extends BaseRepository<
  User,
  CreateUserInput,
  UpdateUserInput
> {
  constructor(db: DatabaseClient) {
    super(db, userMetadata);
  }
}
