import { BaseRepository } from "@/core/repositories/base.repository.js";
import { userMetadata } from "./user.metadata.js";
import type { User } from "./user.types.js";
import { DatabaseClient } from "@/core/database/database.client.js";
import { CreateUserDto, UpdateUserDto } from "@/modules/user/user.dto.js";

export class UserRepository extends BaseRepository<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(db: DatabaseClient) {
    super(db, userMetadata);
  }
}
