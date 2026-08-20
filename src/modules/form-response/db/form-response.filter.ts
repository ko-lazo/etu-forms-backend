import { BaseFilter } from "@/core/repositories/base.filter.js";
import { type FindFormResponseDto } from "../api/form-response.dto.js";
import { formResponseMetadata } from "./form-response.metadata.js";
import { type FormResponse } from "../form-response.types.js";

export class FormResponseFilter extends BaseFilter<FormResponse> {
  constructor(query: FindFormResponseDto) {
    super(formResponseMetadata);

    if (query.formId) this.formId(query.formId);

    for (const [name, value] of Object.entries(query.answer ?? {})) {
      this.answerContains(name, value);
    }

    if (query.answered) this.answered(query.answered);

    if (query.submitted !== undefined) this.submitted(query.submitted);

    this.dateRange("submittedAt", query.submittedFrom, query.submittedTo);
  }

  private formId(value: string): void {
    this.add(`${this.col("formId")} = ?`, value);
  }

  private answered(names: string[]): void {
    this.add(`jsonb_exists_all(${this.col("answers")}, ?::text[])`, names);
  }

  private answerContains(name: string, value: string): void {
    this.add(`${this.col("answers")} ->> ? ILIKE ?`, name, `%${value}%`);
  }

  private submitted(value: boolean): void {
    this.add(`${this.col("submittedAt")} IS ${value ? "NOT NULL" : "NULL"}`);
  }
}
