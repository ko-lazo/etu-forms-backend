import { IResourcePolicy } from "@/core/policies/policy.interface.js";
import { Form } from "./form.types.js";

export class FormPolicy implements IResourcePolicy<Form> {
  view(userId: string | undefined, form: Form): boolean {
    const now = new Date();
    const isPublished = form.publishedAt && new Date(form.publishedAt) <= now;
    const isNotArchived = !form.archivedAt || new Date(form.archivedAt) > now;
    if (isPublished && isNotArchived) {
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
