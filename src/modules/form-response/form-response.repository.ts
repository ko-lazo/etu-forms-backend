import { BaseRepository } from "@/core/repositories/base.repository.js";
import { DatabaseClient } from "@/core/database/database.client.js";
import {
  CreateFormResponseDto,
  UpdateFormResponseDto,
} from "./form-response.dto.js";
import type { FormResponse } from "./form-response.types.js";
import { formResponseMetadata } from "@/modules/form-response/form-response.metadata.js";

export class FormResponseRepository extends BaseRepository<
  FormResponse,
  CreateFormResponseDto,
  UpdateFormResponseDto
> {
  constructor(db: DatabaseClient) {
    super(db, formResponseMetadata);
  }
}
