import { BaseScope } from "@/core/repositories/base.scope.js";
import { Form } from "@/modules/form/form.types.js";
import { formMetadata } from "@/modules/form/form.metadata.js";

export class FormScope extends BaseScope<Form> {
  constructor(userId: string) {
    super(formMetadata);

    this.add(`${this.col("userId")} = ?`, userId);
  }
}
