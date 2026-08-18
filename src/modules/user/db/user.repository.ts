import { BaseRepository } from "@/core/repositories/base.repository.js";
import { userMetadata } from "./user.metadata.js";
import type { User, UserCreate, UserUpdate } from "../user.types.js";
import { type DatabaseClient } from "@/core/database/database.client.js";

export class UserRepository extends BaseRepository<
  User,
  UserCreate,
  UserUpdate
> {
  constructor(db: DatabaseClient) {
    super(db, userMetadata);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.db.queryOne<User>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email],
      this.metadata.columns,
    );
  }
}
