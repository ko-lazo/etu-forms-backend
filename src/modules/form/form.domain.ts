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

/**
 * Публично доступно всем
 */
export function isPubliclyVisible(form: Form, now = new Date()): boolean {
  return resolveFormStatus(form, now) === FORM_STATUS.PUBLISHED;
}

export function isOwnedBy(form: Form, userId: string | undefined): boolean {
  return userId !== undefined && form.userId === userId;
}

/**
 * Опубликовать можно только черновик и запланированную форму
 */
export function canPublish(form: Form, now = new Date()): boolean {
  const status = resolveFormStatus(form, now);

  return status === FORM_STATUS.DRAFT || status === FORM_STATUS.SCHEDULED;
}

/**
 * Снять с публикации можно любую форму с известной датой публикации
 */
export function canUnpublish(form: Form, now = new Date()): boolean {
  return (
    form.publishedAt !== null &&
    resolveFormStatus(form, now) !== FORM_STATUS.ARCHIVED
  );
}

/**
 * Архивировать можно любую форму, кроме уже архивной
 */
export function canArchive(form: Form, now = new Date()): boolean {
  return resolveFormStatus(form, now) !== FORM_STATUS.ARCHIVED;
}

/**
 * Отменить архивацию можно дял любой формы с известной датой архивации
 */
export function canUnarchive(form: Form): boolean {
  return form.archivedAt !== null;
}
