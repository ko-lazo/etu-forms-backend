import { BaseFilter } from "@/core/repositories/base.filter.js";
import { type Form } from "../form.types.js";
import { FORM_STATUS, type FormStatus } from "../form.domain.js";
import { type FindFormDto } from "../api/form.dto.js";
import { formMetadata } from "./form.metadata.js";

export class FormFilter extends BaseFilter<Form> {
  constructor(query: FindFormDto, now = new Date()) {
    super(formMetadata);

    if (query.title) this.title(query.title);

    if (query.status) this.status(query.status, now);

    this.dateRange("createdAt", query.createdFrom, query.createdTo);
  }

  private title(value: string): void {
    this.add(`${this.col("title")} ILIKE ?`, `%${value}%`);
  }

  private status(value: FormStatus, now: Date): void {
    const archivedAt = this.col("archivedAt");
    const publishedAt = this.col("publishedAt");

    this.add(
      `CASE
        WHEN ${archivedAt} IS NOT NULL AND ${archivedAt} <= ? THEN '${FORM_STATUS.ARCHIVED}'
        WHEN ${publishedAt} IS NULL THEN '${FORM_STATUS.DRAFT}'
        WHEN ${publishedAt} <= ? THEN '${FORM_STATUS.PUBLISHED}'
        ELSE '${FORM_STATUS.SCHEDULED}'
      END = ?`,
      now,
      now,
      value,
    );
  }
}
