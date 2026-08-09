import { fakerRU as faker } from "@faker-js/faker";
import type { FormSchemaDto } from "@/modules/form/schema/form-schema.schema.js";
import type { FormResponseDto } from "./form-response.dto.js";
import { FormResponseCreate } from "@/modules/form-response/form-response.types.js";

type Answer = FormResponseDto["answers"][string];

type FormElement = FormSchemaDto["pages"][number]["elements"][number];

function makeAnswer(element: FormElement): Answer {
  switch (element.type) {
    case "text": {
      const minLength = element.validation?.minLength ?? 0;
      const maxLength = element.validation?.maxLength ?? 255;

      let text = faker.lorem.words({ min: 2, max: 5 });

      if (text.length > maxLength) {
        text = text.slice(0, maxLength).trim();
      }
      if (text.length < minLength) {
        text = text.padEnd(minLength, "x");
      }

      return text;
    }

    case "email":
      return faker.internet.email();

    case "textarea": {
      const minLength = element.validation?.minLength ?? 0;
      const maxLength = element.validation?.maxLength ?? 200;

      let paragraph = faker.lorem.paragraph();

      if (paragraph.length > maxLength) {
        paragraph = paragraph.slice(0, maxLength).trim();
      }
      if (paragraph.length < minLength) {
        paragraph = paragraph.padEnd(minLength, "x");
      }

      return paragraph;
    }

    case "number":
      return faker.number.int({
        min: element.validation?.min ?? 0,
        max: element.validation?.max ?? 100,
      });

    case "dropdown":
    case "radiogroup":
      return faker.helpers.arrayElement(element.choices).value;

    case "checkbox":
      return faker.helpers
        .arrayElements(element.choices, {
          min: 1,
          max: Math.min(3, element.choices.length),
        })
        .map((choice) => choice.value);

    case "file": {
      const maxFilesCount = element.validation?.maxFilesCount ?? 1;

      const filesCount = faker.number.int({
        min: 1,
        max: maxFilesCount,
      });

      return Array.from(
        { length: filesCount },
        () => `file_${faker.string.uuid()}`,
      );
    }
  }
}

export function makeFormResponse(
  formId: string,
  schema: FormSchemaDto,
): FormResponseCreate {
  const answers: Record<string, Answer> = {};

  for (const page of schema.pages) {
    for (const element of page.elements) {
      answers[element.name] = makeAnswer(element);
    }
  }

  return {
    formId,
    answers,
    metadata: {},
    submittedAt: faker.date.recent(),
  };
}
