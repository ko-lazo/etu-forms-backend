import { createCrudService } from "@/core/services/crud.service.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import {
  canArchive,
  canPublish,
  canUnarchive,
  canUnpublish,
} from "./form.domain.js";
import type { Form } from "./form.types.js";
import { type FormRepository } from "./db/form.repository.js";

export function createFormService(repository: FormRepository) {
  return {
    ...createCrudService(repository),

    /**
     * Открывает форму публично с возможностью отложенной публикации
     */
    async publish(form: Form, date: Date): Promise<Form> {
      if (!canPublish(form)) {
        throw new BadRequestError(
          "Опубликовать можно только черновик или запланированную форму",
        );
      }

      return await repository.publish(form.id, date);
    },

    /**
     * Возвращает форму в черновики, отменяя любую публикацию
     */
    async unpublish(form: Form): Promise<Form> {
      if (!canUnpublish(form)) {
        throw new BadRequestError("Форма не опубликована и не запланирована");
      }

      return await repository.unpublish(form.id);
    },

    /**
     * Закрывает форму, ответы и дата публикации сохраняются
     */
    async archive(form: Form, date: Date): Promise<Form> {
      if (!canArchive(form)) {
        throw new BadRequestError("Форма уже в архиве");
      }

      return await repository.archive(form.id, date);
    },

    /**
     * Достаёт форму из архива, возвращая её в статус по дате публикации
     */
    async unarchive(form: Form): Promise<Form> {
      if (!canUnarchive(form)) {
        throw new BadRequestError("Форма не в архиве");
      }

      return await repository.unarchive(form.id);
    },
  };
}

export type FormService = ReturnType<typeof createFormService>;
