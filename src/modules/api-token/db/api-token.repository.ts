import { BaseRepository } from "@/core/repositories/base.repository.js";
import { type DatabaseClient } from "@/core/database/database.client.js";
import {
  type ApiToken,
  type ApiTokenCreate,
  type ApiTokenUpdate,
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
    return await this.db.queryOne<ApiToken>(
      `SELECT * FROM api_tokens WHERE token = $1 LIMIT 1`,
      [hashedToken],
      this.metadata.columns,
    );
  }
}
