import { fakerRU as faker } from "@faker-js/faker";
import { FormSchemaDto } from "./schema/form-schema.schema.js";
import { CreateFormInput } from "./form.types.js";

type FormElement = FormSchemaDto["pages"][number]["elements"][number];

function makeValidName(prefix: string): string {
  return `${prefix}_${faker.string.alphanumeric({ length: 5, casing: "mixed" })}`;
}

function makeRandomField(): FormElement {
  const types = ["text", "number", "dropdown", "file"] as const;
  const type = faker.helpers.arrayElement(types);

  const base = {
    name: makeValidName(type),
    label: faker.lorem.sentence({ min: 3, max: 7 }) + "?",
    required: faker.datatype.boolean(0.3),
    placeholder: faker.datatype.boolean(0.5) ? faker.lorem.words(3) : undefined,
  };

  switch (type) {
    case "text":
      return {
        ...base,
        type: faker.helpers.arrayElement([
          "text",
          "email",
          "textarea",
        ] as const),
        validation: faker.datatype.boolean(0.5)
          ? {
              minLength: faker.datatype.boolean(0.5)
                ? faker.number.int({ min: 2, max: 5 })
                : undefined,
              maxLength: faker.datatype.boolean(0.5)
                ? faker.number.int({ min: 20, max: 100 })
                : undefined,
            }
          : undefined,
      };

    case "number":
      return {
        ...base,
        type: "number" as const,
        validation: faker.datatype.boolean(0.5)
          ? {
              min: faker.datatype.boolean(0.5)
                ? faker.number.int({ min: 0, max: 18 })
                : undefined,
              max: faker.datatype.boolean(0.5)
                ? faker.number.int({ min: 50, max: 100 })
                : undefined,
            }
          : undefined,
      };

    case "dropdown":
      const choicesCount = faker.number.int({ min: 2, max: 5 });
      const choices = Array.from({ length: choicesCount }, (_, i) => ({
        value: `val_${i + 1}`,
        text: faker.lorem.word(),
      }));
      return {
        ...base,
        type: faker.helpers.arrayElement([
          "dropdown",
          "radiogroup",
          "checkbox",
        ] as const),
        choices,
      };

    case "file":
      const rawMimeTypes = faker.helpers.arrayElement([
        ["image/jpeg", "image/png"],
        ["application/pdf"],
        ["image/*", "application/pdf"],
      ]);

      return {
        ...base,
        type: "file" as const,
        validation: faker.datatype.boolean(0.5)
          ? {
              maxFileSizeMb: faker.number.int({ min: 1, max: 20 }),
              maxFilesCount: faker.number.int({ min: 1, max: 5 }),
              allowedMimeTypes: [...rawMimeTypes],
            }
          : undefined,
      };

    default:
      throw new Error(`Unknown type`);
  }
}

export function makeFormSchema(): FormSchemaDto {
  const pagesCount = faker.number.int({ min: 1, max: 4 });

  const pages = Array.from({ length: pagesCount }, (_, index) => {
    const elementsCount = faker.number.int({ min: 2, max: 6 });
    const elements = Array.from({ length: elementsCount }, () =>
      makeRandomField(),
    );

    return {
      name: makeValidName(`page_${index + 1}`),
      title: faker.datatype.boolean(0.8)
        ? `Страница ${index + 1}: ${faker.lorem.words(2)}`
        : undefined,
      elements,
    };
  });

  return { pages };
}

export function makeForm(
  overrides: Partial<CreateFormInput> = {},
): CreateFormInput {
  return {
    userId: faker.string.uuid(),
    title: faker.lorem.sentence({ min: 3, max: 10 }),
    schema: makeFormSchema(),
    settings: {
      theme: faker.helpers.arrayElement(["light", "dark", "contrast"]),
      showProgressBar: faker.datatype.boolean(),
    },
    ...overrides,
  };
}

export function makeForms(
  count: number,
  overrides: Partial<CreateFormInput> = {},
): CreateFormInput[] {
  return Array.from({ length: count }, (_, index) => makeForm(overrides));
}
