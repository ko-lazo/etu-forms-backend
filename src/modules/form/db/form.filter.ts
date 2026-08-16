import { BaseFilter } from "@/core/repositories/base.filter.js";
import { Form } from "../form.types.js";
import { FindFormDto } from "../api/form.dto.js";
import { formMetadata } from "./form.metadata.js";

export class FormFilter extends BaseFilter<Form> {
  constructor(query: FindFormDto) {
    super(formMetadata);

    if (query.title) {
      this.title(query.title);
    }
  }

  private title(value: string): void {
    this.add(`${this.col("title")} ILIKE ?`, `%${value}%`);
  }
}
