import { createCrudService } from "@/core/services/crud.service.js";
import { BadRequestError } from "@/shared/errors/bad-request.error.js";
import { NotFoundError } from "@/shared/errors/not-found.error.js";
import type { FormService } from "@/modules/form/index.js";

import { type FormResponseRepository } from "./db/form-response.repository.js";
import type {
  FormResponse,
  FormResponseAnswers,
  FormResponseCreate,
  FormResponseUpdate,
} from "./form-response.types.js";
import { validateFormResponse } from "./form-response.validator.js";

export function createFormResponseService(
  repository: FormResponseRepository,
  formService: FormService,
) {
  const crud = createCrudService(repository);

  const assertMatchesFormSchema = async (
    formId: string,
    answers: FormResponseAnswers,
  ): Promise<void> => {
    const form = await formService.findById(formId);

    if (!form) {
      throw new NotFoundError("Форма не найдена");
    }

    const errors = validateFormResponse(form.schema, answers);

    if (errors.length > 0) {
      throw new BadRequestError("Validation failed", errors);
    }
  };

  return {
    findById: crud.findById,
    findAll: crud.findAll,
    delete: crud.delete,

    async create(data: FormResponseCreate): Promise<FormResponse> {
      await assertMatchesFormSchema(data.formId, data.answers);

      return await repository.create(data);
    },

    async update(id: string, data: FormResponseUpdate): Promise<FormResponse> {
      const response = await repository.findById(id);

      if (!response) {
        throw new NotFoundError("Ответ не найден");
      }

      await assertMatchesFormSchema(response.formId, data.answers);

      return await repository.update(id, data);
    },
  };
}

export type FormResponseService = ReturnType<typeof createFormResponseService>;
