import type { Pool } from "pg";

import { BaseRepository } from "../../core/repositories/base.repository.js";

import { formMetadata } from "./form.metadata.js";

import type { CreateFormInput, Form, UpdateFormInput } from "./form.types.js";

export class FormRepository extends BaseRepository<
  Form,
  CreateFormInput,
  UpdateFormInput
> {
  constructor(pool: Pool) {
    super(pool, formMetadata);
  }

  async publish(id: string): Promise<Form> {
    const form = await this.db.queryOne(
      `
        UPDATE forms
        SET
          published_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );

    if (!form) {
      throw new Error("Form not found");
    }

    return form;
  }

  async archive(id: string): Promise<Form> {
    const form = await this.db.queryOne(
      `
        UPDATE forms
        SET
          archived_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id],
    );

    if (!form) {
      throw new Error("Form not found");
    }

    return form;
  }
}
