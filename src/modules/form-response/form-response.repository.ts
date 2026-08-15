import { BaseRepository } from "@/core/repositories/base.repository.js";
import { DatabaseClient } from "@/core/database/database.client.js";
import type {
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate,
} from "./form-response.types.js";
import { formResponseMetadata } from "@/modules/form-response/form-response.metadata.js";

export class FormResponseRepository extends BaseRepository<
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate
> {
  constructor(db: DatabaseClient) {
    super(db, formResponseMetadata);
  }
}
