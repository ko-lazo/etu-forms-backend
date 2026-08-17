import { type IResourcePolicy } from "@/core/policies/policy.interface.js";
import { isPubliclyVisible } from "./form.domain.js";
import { type Form } from "./form.types.js";

export function createFormPolicy(): IResourcePolicy<Form> {
  const owns = (userId: string | undefined, form: Form) =>
    userId !== undefined && form.userId === userId;

  return {
    view: (userId, form) => isPubliclyVisible(form) || owns(userId, form),
    create: (userId) => userId !== undefined,
    update: owns,
    delete: owns,
  };
}

export type FormPolicy = ReturnType<typeof createFormPolicy>;
