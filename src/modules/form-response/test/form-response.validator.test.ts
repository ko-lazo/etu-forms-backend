import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FormSchema } from "@/modules/form/index.js";
import type { FormResponseAnswers } from "../form-response.types.js";
import { validateFormResponse } from "../form-response.validator.js";

type FormElement = FormSchema["pages"][number]["elements"][number];

function makeSinglePageSchema(...elements: FormElement[]): FormSchema {
  return { pages: [{ name: "page_1", elements }] };
}

function getInvalidFields(
  schema: FormSchema,
  answers: FormResponseAnswers,
): string[] {
  return validateFormResponse(schema, answers).map((error) => error.field);
}

describe("Валидатор ответов на формы", () => {
  it("проверяет обязательное текстовое поле", () => {
    const schema = makeSinglePageSchema(
      { name: "nick", type: "text", label: "Ник", required: true },
      { name: "bio", type: "textarea", label: "О себе", required: false },
    );

    assert.deepEqual(getInvalidFields(schema, { nick: "kolazo" }), []);
    assert.deepEqual(getInvalidFields(schema, {}), ["nick"]);
  });
});
