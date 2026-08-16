import { BaseScope } from "@/core/repositories/base.scope.js";
import { type Form } from "../form.types.js";
import { formMetadata } from "./form.metadata.js";

export class FormScope extends BaseScope<Form> {
  constructor(userId: string) {
    super(formMetadata);

    this.add(`${this.col("userId")} = ?`, userId);
  }
}
