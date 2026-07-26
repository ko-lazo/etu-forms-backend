import { makeForm } from "./form.factory.js";
import { Form, CreateFormInput } from "./form.types.js";
import { createFormModule } from "./form.module.js";
import { User } from "@/modules/user/user.types.js";

export async function seedForms(users: User[]): Promise<Form[]> {
  const formModule = createFormModule();
  const fakeFormsInput: CreateFormInput[] = [];

  for (const user of users) {
    const formsCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < formsCount; i++) {
      fakeFormsInput.push(makeForm({ userId: user.id }));
    }
  }

  const createdForms: Form[] = [];
  const chunkSize = 50;

  for (let i = 0; i < fakeFormsInput.length; i += chunkSize) {
    const chunk = fakeFormsInput.slice(i, i + chunkSize);
    const savedChunk = await Promise.all(
      chunk.map((form) => formModule.service.create(form)),
    );
    createdForms.push(...savedChunk);
  }

  return createdForms;
}
