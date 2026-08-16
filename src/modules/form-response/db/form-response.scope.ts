import { BaseScope } from "@/core/repositories/base.scope.js";
import type { FormResponse } from "../form-response.types.js";
import { formResponseMetadata } from "./form-response.metadata.js";

export class FormResponseScope extends BaseScope<FormResponse> {
  constructor(formId: string) {
    super(formResponseMetadata);

    this.add(`${this.col("formId")} = ?`, formId);
  }
}
