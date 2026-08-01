import { BaseRepository } from "@/core/repositories/base.repository.js";
import { DatabaseClient } from "@/core/database/database.client.js";
import {
  ApiToken,
  ApiTokenCreate,
  ApiTokenUpdate,
} from "@/modules/api-token/api-token.types.js";
import { apiTokenMetadata } from "@/modules/api-token/api-token.metadata.js";

export class ApiTokenRepository extends BaseRepository<
  ApiToken,
  ApiTokenCreate,
  ApiTokenUpdate
> {
  constructor(db: DatabaseClient) {
    super(db, apiTokenMetadata);
  }
}
