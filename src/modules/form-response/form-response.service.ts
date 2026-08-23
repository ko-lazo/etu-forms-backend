import { createCrudService } from "@/core/services/crud.service.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import type { FormService } from "@/modules/form/index.js";
import { type FormResponseRepository } from "./db/form-response.repository.js";
import { isSubmitted } from "./form-response.domain.js";
import type {
  FormResponse,
  FormResponseAnswers,
  FormResponseCreate,
  FormResponseUpdate,
} from "./form-response.types.js";
import {
  validateFormResponse,
  type FormResponseValidationOptions,
} from "./form-response.validator.js";

export function createFormResponseService(
  repository: FormResponseRepository,
  formService: FormService,
) {
  const crud = createCrudService(repository);

  async function validate(
    formId: string,
    answers: FormResponseAnswers,
    options: FormResponseValidationOptions,
  ): Promise<void> {
    const form = await formService.findById(formId);

    if (!form) {
      throw new NotFoundError("Форма не найдена");
    }

    const errors = validateFormResponse(form.schema, answers, options);

    if (errors.length > 0) {
      throw new BadRequestError("Validation failed", errors);
    }
  }

  async function create(data: FormResponseCreate): Promise<FormResponse> {
    await validate(data.formId, data.answers, { isDraft: true });
    return await repository.create(data);
  }

  async function update(
    id: string,
    data: FormResponseUpdate,
  ): Promise<FormResponse> {
    const response = await repository.findById(id);

    if (!response) {
      throw new NotFoundError("Ответ не найден");
    }

    await validate(response.formId, data.answers ?? response.answers, {
      isDraft: !isSubmitted(response),
    });

    return await repository.update(id, data);
  }

  async function submit(response: FormResponse): Promise<FormResponse> {
    if (isSubmitted(response)) {
      throw new BadRequestError("Ответ уже был отправлен");
    }

    await validate(response.formId, response.answers, { isDraft: false });

    return await repository.submit(response.id);
  }

  return {
    findById: crud.findById,
    findAll: crud.findAll,
    delete: crud.delete,
    create,
    update,
    submit,
  };
}

export type FormResponseService = ReturnType<typeof createFormResponseService>;
