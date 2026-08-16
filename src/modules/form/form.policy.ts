import { type IResourcePolicy } from "@/core/policies/policy.interface.js";
import { isPubliclyVisible } from "./form.domain.js";
import { type Form } from "./form.types.js";

export class FormPolicy implements IResourcePolicy<Form> {
  view(userId: string | undefined, form: Form): boolean {
    if (isPubliclyVisible(form)) {
      return true;
    }

    return !!userId && form.userId === userId;
  }

  update(userId: string, form: Form): boolean {
    return form.userId === userId;
  }

  delete(userId: string, form: Form): boolean {
    return form.userId === userId;
  }
}

export const formPolicy = new FormPolicy();
