import { BaseFilter } from "@/core/repositories/base.filter.js";
import { FindFormResponseDto } from "./form-response.dto.js";
import { formResponseMetadata } from "./form-response.metadata.js";
import { FormResponse } from "@/modules/form-response/form-response.types.js";

export class FormResponseFilter extends BaseFilter<FormResponse> {
  constructor(query: FindFormResponseDto) {
    super(formResponseMetadata);

    if (query.formId) {
      this.formId(query.formId);
    }
  }

  private formId(value: string): void {
    this.add(`${this.col("formId")} = ?`, value);
  }
}
