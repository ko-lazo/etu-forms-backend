import type { Form } from "./form.types.js";

export const FORM_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type FormStatus = (typeof FORM_STATUS)[keyof typeof FORM_STATUS];

export function resolveFormStatus(form: Form, now = new Date()): FormStatus {
  if (form.archivedAt && form.archivedAt <= now) return FORM_STATUS.ARCHIVED;
  if (!form.publishedAt) return FORM_STATUS.DRAFT;

  return form.publishedAt <= now
    ? FORM_STATUS.PUBLISHED
    : FORM_STATUS.SCHEDULED;
}

export function isPubliclyVisible(form: Form, now = new Date()): boolean {
  return resolveFormStatus(form, now) === FORM_STATUS.PUBLISHED;
}
