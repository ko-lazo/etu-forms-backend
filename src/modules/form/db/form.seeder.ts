import { makeForms } from "./form.factory.js";
import type { Form } from "../form.types.js";
import type { FormRepository } from "./form.repository.js";
import type { User } from "@/modules/user/index.js";

const INSERT_BATCH_SIZE = 200;

export async function seedForms(
  repository: FormRepository,
  users: User[],
  formsPerUser: () => number,
): Promise<Form[]> {
  const fakeFormsInput = users.flatMap((user) =>
    makeForms(formsPerUser(), { userId: user.id }),
  );

  const created: Form[] = [];

  for (let i = 0; i < fakeFormsInput.length; i += INSERT_BATCH_SIZE) {
    const batch = fakeFormsInput.slice(i, i + INSERT_BATCH_SIZE);
    created.push(...(await repository.createMany(batch)));
  }

  return created;
}
