import { BaseRepository } from "@/core/repositories/base.repository.js";
import { formMetadata } from "./form.metadata.js";
import type { Form, FormCreate, FormUpdate } from "../form.types.js";
import { type DatabaseClient } from "@/core/database/database.client.js";

export class FormRepository extends BaseRepository<
  Form,
  FormCreate,
  FormUpdate
> {
  constructor(db: DatabaseClient) {
    super(db, formMetadata);
  }
}
