import { makeFormResponse } from "./form-response.factory.js";
import type { FormResponseCreate } from "../form-response.types.js";
import type { FormResponseRepository } from "./form-response.repository.js";
import type { Form } from "@/modules/form/index.js";

/** Сколько ответов уходит в БД одним INSERT. */
const INSERT_BATCH_SIZE = 500;

/**
 * Генерирует ответы пачками
 */
function* generateResponseBatches(
  forms: Form[],
  responsesPerForm: () => number,
): Generator<FormResponseCreate[]> {
  let batch: FormResponseCreate[] = [];

  for (const form of forms) {
    const responsesCount = responsesPerForm();

    for (let i = 0; i < responsesCount; i++) {
      batch.push(makeFormResponse(form.id, form.schema));

      if (batch.length === INSERT_BATCH_SIZE) {
        yield batch;
        batch = [];
      }
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}

export async function seedFormResponses(
  repository: FormResponseRepository,
  forms: Form[],
  responsesPerForm: () => number,
): Promise<number> {
  let createdCount = 0;

  for (const batch of generateResponseBatches(forms, responsesPerForm)) {
    const savedBatch = await repository.createMany(batch);
    createdCount += savedBatch.length;
  }

  return createdCount;
}
