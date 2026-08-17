import { type IResourcePolicy } from "@/core/policies/policy.interface.js";
import { isOwnedBy, isPubliclyVisible } from "./form.domain.js";
import { type Form } from "./form.types.js";

export function createFormPolicy(): IResourcePolicy<Form> {
  const owns = (userId: string | undefined, form: Form) =>
    isOwnedBy(form, userId);

  return {
    view: (userId, form) => isPubliclyVisible(form) || owns(userId, form),
    create: (userId) => userId !== undefined,
    update: owns,
    delete: owns,
  };
}

export type FormPolicy = ReturnType<typeof createFormPolicy>;
