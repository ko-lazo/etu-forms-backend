import { BaseRepository } from "../../core/repositories/base.repository.js";

import { formMetadata } from "./form.metadata.js";

import type { CreateFormInput, Form, UpdateFormInput } from "./form.types.js";
import { DatabaseClient } from "../../core/database/database.client";

export class FormRepository extends BaseRepository<
  Form,
  CreateFormInput,
  UpdateFormInput
> {
  constructor(db: DatabaseClient) {
    super(db, formMetadata);
  }

  async publish(id: string): Promise<Form> {
    const form = await this.db.queryOne<Form>(
      `UPDATE forms SET published_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );

    if (!form) {
      throw new Error("Form not found");
    }

    return form;
  }

  async archive(id: string): Promise<Form> {
    const form = await this.db.queryOne<Form>(
      `UPDATE forms SET archived_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );

    if (!form) {
      throw new Error("Form not found");
    }

    return form;
  }
}
