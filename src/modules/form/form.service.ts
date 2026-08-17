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
  /**
   * Открывает форму публично с возможностью отложенной публикации
   */
  const publish = async (form: Form, date: Date): Promise<Form> => {
    if (!canPublish(form)) {
      throw new BadRequestError(
        "Опубликовать можно только черновик или запланированную форму",
      );
    }

    return await repository.publish(form.id, date);
  };

  /**
   * Возвращает форму в черновики, отменяя любую публикацию
   */
  const unpublish = async (form: Form): Promise<Form> => {
    if (!canUnpublish(form)) {
      throw new BadRequestError("Форма не опубликована и не запланирована");
    }

    return await repository.unpublish(form.id);
  };

  /**
   * Закрывает форму, ответы и дата публикации сохраняются
   */
  const archive = async (form: Form, date: Date): Promise<Form> => {
    if (!canArchive(form)) {
      throw new BadRequestError("Форма уже в архиве");
    }

    return await repository.archive(form.id, date);
  };

  /**
   * Достаёт форму из архива, возвращая её в статус по дате публикации
   */
  const unarchive = async (form: Form): Promise<Form> => {
    if (!canUnarchive(form)) {
      throw new BadRequestError("Форма не в архиве");
    }

    return await repository.unarchive(form.id);
  };

  return {
    ...createCrudService(repository),
    publish,
    unpublish,
    archive,
    unarchive,
  };
}

export type FormService = ReturnType<typeof createFormService>;
