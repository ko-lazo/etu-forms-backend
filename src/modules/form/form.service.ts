import { BaseService } from "@/core/services/base.service.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import {
  canArchive,
  canPublish,
  canUnarchive,
  canUnpublish,
} from "./form.domain.js";
import type { Form, FormCreate, FormUpdate } from "./form.types.js";
import { type FormRepository } from "./db/form.repository.js";

export class FormService extends BaseService<Form, FormCreate, FormUpdate> {
  constructor(protected override readonly repository: FormRepository) {
    super(repository);
  }

  /**
   * Открывает форму публично с возможностью отложенной публикации
   */
  async publish(form: Form, date: Date): Promise<Form> {
    if (!canPublish(form)) {
      throw new BadRequestError(
        "Опубликовать можно только черновик или запланированную форму",
      );
    }

    return await this.repository.update(form.id, { publishedAt: date });
  }

  /**
   * Возвращает форму в черновики, отменяя любую публикацию
   */
  async unpublish(form: Form): Promise<Form> {
    if (!canUnpublish(form)) {
      throw new BadRequestError("Форма не опубликована и не запланирована");
    }

    return await this.repository.update(form.id, { publishedAt: null });
  }

  /**
   * Закрывает форму, ответы и дата публикации сохраняются
   */
  async archive(form: Form, date: Date): Promise<Form> {
    if (!canArchive(form)) {
      throw new BadRequestError("Форма уже в архиве");
    }

    return await this.repository.update(form.id, { archivedAt: date });
  }

  /**
   * Достаёт форму из архива, возвращая её в статус по дате публикации
   */
  async unarchive(form: Form): Promise<Form> {
    if (!canUnarchive(form)) {
      throw new BadRequestError("Форма не в архиве");
    }

    return await this.repository.update(form.id, { archivedAt: null });
  }
}
