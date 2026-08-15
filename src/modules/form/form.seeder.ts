import { makeForms } from "./form.factory.js";
import { Form } from "./form.types.js";
import { createFormModule } from "./form.module.js";
import { User } from "@/modules/user/user.types.js";
import { chunked, CountRandom, resolveCount } from "@/core/database/seed.js";

export async function seedForms(
  users: User[],
  formsPerUser: CountRandom,
): Promise<Form[]> {
  const formModule = createFormModule();

  const fakeFormsInput = users.flatMap((user) =>
    makeForms(resolveCount(formsPerUser), { userId: user.id }),
  );

  const createdForms: Form[] = [];

  for (const chunk of chunked(fakeFormsInput)) {
    const savedChunk = await Promise.all(
      chunk.map((form) => formModule.service.create(form)),
    );

    createdForms.push(...savedChunk);
  }

  return createdForms;
}
