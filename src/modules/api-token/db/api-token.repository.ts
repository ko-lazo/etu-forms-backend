import { BaseRepository } from "@/core/repositories/base.repository.js";
import { DatabaseClient } from "@/core/database/database.client.js";
import {
  ApiToken,
  ApiTokenCreate,
  ApiTokenUpdate,
} from "../api-token.types.js";
import { apiTokenMetadata } from "./api-token.metadata.js";

export class ApiTokenRepository extends BaseRepository<
  ApiToken,
  ApiTokenCreate,
  ApiTokenUpdate
> {
  constructor(db: DatabaseClient) {
    super(db, apiTokenMetadata);
  }

  async findByToken(hashedToken: string): Promise<ApiToken | null> {
    return this.db.queryOne<ApiToken>(
      `SELECT * FROM ${this.table} WHERE ${this.col("token")} = $1 LIMIT 1`,
      [hashedToken],
      this.metadata.columns,
    );
  }
}
