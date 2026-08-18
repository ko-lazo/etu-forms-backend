import { BaseRepository } from "@/core/repositories/base.repository.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
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

  publish(id: string, date: Date): Promise<Form> {
    return this.writeLifecycleDate(id, "publishedAt", date);
  }

  unpublish(id: string): Promise<Form> {
    return this.writeLifecycleDate(id, "publishedAt", null);
  }

  archive(id: string, date: Date): Promise<Form> {
    return this.writeLifecycleDate(id, "archivedAt", date);
  }

  unarchive(id: string): Promise<Form> {
    return this.writeLifecycleDate(id, "archivedAt", null);
  }

  private async writeLifecycleDate(
    id: string,
    property: "publishedAt" | "archivedAt",
    date: Date | null,
  ): Promise<Form> {
    const form = await this.db.queryOne<Form>(
      `UPDATE forms
       SET ${this.rawCol(property)} = $2
       WHERE id = $1
       RETURNING *`,
      [id, date],
      this.metadata.columns,
    );

    if (!form) {
      throw new NotFoundError("Форма не найдена");
    }

    return form;
  }
}
