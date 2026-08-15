import type { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import QueryStream from "pg-query-stream";

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

  async countByFormId(formId: string): Promise<number> {
    const row = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ${this.table} WHERE form_id = $1`,
      [formId],
    );

    return row ? Number(row.count) : 0;
  }

  /**
   * Достаёт ответы на форму пачками. Автоматически управляет
   * соединением и уничтожает поток после обработки.
   * @param formId Идентификатор формы
   * @param consume Функция обработки потока строк
   * @returns Результат выполнения `consume`
   */
  async streamByFormId<T>(
    formId: string,
    consume: (rows: Readable) => Promise<T>,
  ): Promise<T> {
    return this.db.withClient(async (client) => {
      const stream = client.query(
        new QueryStream(
          `SELECT id,
                  answers,
                  created_at AS "createdAt",
                  submitted_at AS "submittedAt"
           FROM ${this.table}
           WHERE form_id = $1
           ORDER BY created_at`,
          [formId],
          { batchSize: 500 },
        ),
      );

      try {
        return await consume(stream);
      } finally {
        stream.destroy();
        await finished(stream).catch(() => undefined);
      }
    });
  }
}
