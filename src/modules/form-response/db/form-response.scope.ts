import { BaseScope } from "@/core/repositories/base.scope.js";
import type { FormResponse } from "../form-response.types.js";
import { formResponseMetadata } from "./form-response.metadata.js";

export class FormResponseScope extends BaseScope<FormResponse> {
  constructor(formId: string, ownerId: string) {
    super(formResponseMetadata);

    this.add(`${this.col("formId")} = ?`, formId);

    this.add(
      `${this.col("formId")} IN (SELECT id FROM forms WHERE user_id = ?)`,
      ownerId,
    );
  }
}
