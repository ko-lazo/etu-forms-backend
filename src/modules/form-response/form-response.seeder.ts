import { makeFormResponse } from "./form-response.factory.js";
import type {
  FormResponse,
  FormResponseCreate,
} from "./form-response.types.js";
import type { Form } from "@/modules/form/form.types.js";
import { createFormResponseModule } from "./form-response.module.js";
import { createFormModule } from "@/modules/form/form.module.js";

export async function seedFormResponses(
  forms: Form[],
): Promise<FormResponse[]> {
  const formModule = createFormModule();
  const formResponseModule = createFormResponseModule(formModule.service);

  const fakeResponses: FormResponseCreate[] = [];

  for (const form of forms) {
    const responsesCount = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < responsesCount; i++) {
      fakeResponses.push(makeFormResponse(form.id, form.schema));
    }
  }

  const createdResponses: FormResponse[] = [];
  const chunkSize = 50;

  for (let i = 0; i < fakeResponses.length; i += chunkSize) {
    const chunk = fakeResponses.slice(i, i + chunkSize);

    const savedChunk = await Promise.all(
      chunk.map((response) => formResponseModule.service.create(response)),
    );

    createdResponses.push(...savedChunk);
  }

  return createdResponses;
}
