import { makeForms } from "./form.factory.js";
import type { Form } from "./form.types.js";
import type { FormService } from "./form.service.js";
import type { User } from "@/modules/user/user.types.js";

export async function seedForms(
  service: FormService,
  users: User[],
  formsPerUser: () => number,
): Promise<Form[]> {
  const fakeFormsInput = users.flatMap((user) =>
    makeForms(formsPerUser(), { userId: user.id }),
  );

  return Promise.all(fakeFormsInput.map((form) => service.create(form)));
}
