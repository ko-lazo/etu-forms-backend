import { IResourcePolicy } from "@/core/policies/policy.interface.js";
import { Form } from "./form.types.js";

export class FormPolicy implements IResourcePolicy<Form> {
  view(userId: string, form: Form): boolean {
    return form.userId === userId;
  }

  update(userId: string, form: Form): boolean {
    return form.userId === userId;
  }

  delete(userId: string, form: Form): boolean {
    return form.userId === userId;
  }
}

export const formPolicy = new FormPolicy();
