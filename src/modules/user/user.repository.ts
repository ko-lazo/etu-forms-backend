import type { Pool } from "pg";
import { BaseRepository } from "../../core/repositories/base.repository";
import { userMetadata } from "./user.metadata";
import type { CreateUserInput, User, UpdateUserInput } from "./user.types";

export class UserRepository extends BaseRepository<
  User,
  CreateUserInput,
  UpdateUserInput
> {
  constructor(pool: Pool) {
    super(pool, userMetadata);
  }
}
