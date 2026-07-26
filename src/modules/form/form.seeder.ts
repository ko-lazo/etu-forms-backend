import { makeForm } from "./form.factory.js";
import { Form, CreateFormInput } from "./form.types.js";
import { User } from "../user/user.types.js";
import { createFormModule } from "./form.module";

export async function seedForms(users: User[]): Promise<Form[]> {
  const formModule = createFormModule();

  const fakeFormsInput: CreateFormInput[] = [];

  for (const user of users) {
    const formsCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < formsCount; i++) {
      fakeFormsInput.push(makeForm({ userId: user.id }));
    }
  }

  return await formModule.service.createMany(fakeFormsInput);
}
