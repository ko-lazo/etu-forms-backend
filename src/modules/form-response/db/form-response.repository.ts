import { BaseRepository } from "@/core/repositories/base.repository.js";
import { type DatabaseClient } from "@/core/database/database.client.js";
import {
  type FormResponse,
  type FormResponseCreate,
  type FormResponseUpdate,
} from "../form-response.types.js";
import type { ExportedResponseRow } from "../export/export.types.js";
import { formResponseMetadata } from "./form-response.metadata.js";

export class FormResponseRepository extends BaseRepository<
  FormResponse,
  FormResponseCreate,
  FormResponseUpdate
> {
  constructor(db: DatabaseClient) {
    super(db, formResponseMetadata);
  }

  async countByFormId(formId: string): Promise<number> {
    const row = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM form_responses WHERE form_id = $1`,
      [formId],
    );

    return row ? Number(row.count) : 0;
  }

  /**
   * Получает ответы по ID формы порциями по 500 строк.
   * Используется для выгрузки больших объемов данных.
   * @param formId Идентификатор формы
   */
  streamByFormId(formId: string): AsyncIterable<ExportedResponseRow> {
    return this.db.stream<ExportedResponseRow>(
      `SELECT id,
              answers,
              created_at AS "createdAt",
              submitted_at AS "submittedAt"
       FROM form_responses
       WHERE form_id = $1
       ORDER BY created_at, id`,
      [formId],
      { batchSize: 500 },
    );
  }
}
