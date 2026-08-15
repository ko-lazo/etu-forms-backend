import { makeFormResponse } from "./form-response.factory.js";
import type { FormResponseCreate } from "./form-response.types.js";
import type { Form } from "@/modules/form/form.types.js";
import { FormResponseRepository } from "./form-response.repository.js";
import { dbClient } from "@/core/database/pool.js";
import { chunked, CountRandom, resolveCount } from "@/core/database/seed.js";

function* generateResponses(
  forms: Form[],
  responsesPerForm: CountRandom,
): Generator<FormResponseCreate> {
  for (const form of forms) {
    const responsesCount = resolveCount(responsesPerForm);

    for (let i = 0; i < responsesCount; i++) {
      yield makeFormResponse(form.id, form.schema);
    }
  }
}

export async function seedFormResponses(
  forms: Form[],
  responsesPerForm: CountRandom,
): Promise<number> {
  const repository = new FormResponseRepository(dbClient);

  let createdCount = 0;

  for (const chunk of chunked(generateResponses(forms, responsesPerForm))) {
    const savedChunk = await repository.createMany(chunk);
    createdCount += savedChunk.length;
  }

  return createdCount;
}
