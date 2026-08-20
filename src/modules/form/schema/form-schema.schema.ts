import { z } from "zod";
import { conditionSchema } from "./condition.schema.js";

const MAX_PAGES = 50;
const MAX_ELEMENTS_PER_PAGE = 200;

export const formElementNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/);

const baseFieldSchema = z.object({
  name: formElementNameSchema,

  label: z.string().min(1).max(500),

  required: z.boolean().default(false),

  placeholder: z.string().optional(),

  visibleIf: conditionSchema.optional(),
});

const choiceOptionSchema = z.object({
  value: z.string(),
  text: z.string(),
});

const textValidation = z.object({
  minLength: z.number().int().nonnegative().optional(),
  maxLength: z.number().int().positive().optional(),
});

const numberValidation = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
});

const fileValidation = z.object({
  maxFileSizeMb: z.number().positive().default(5),
  allowedMimeTypes: z.array(z.string()).min(1).optional(),
  maxFilesCount: z.number().int().positive().default(1),
});

const textFieldSchema = baseFieldSchema.extend({
  type: z.enum(["text", "email", "textarea"]),
  validation: textValidation.optional(),
});

const numberFieldSchema = baseFieldSchema.extend({
  type: z.literal("number"),
  validation: numberValidation.optional(),
});

const selectFieldSchema = baseFieldSchema.extend({
  type: z.enum(["dropdown", "radiogroup", "checkbox"]),
  choices: z.array(choiceOptionSchema).min(1),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fileFieldSchema = baseFieldSchema.extend({
  type: z.literal("file"),
  validation: fileValidation.optional(),
});

export const formElementSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  selectFieldSchema,
  // todo files
  // fileFieldSchema,
]);

export const formElementTypes = formElementSchema.options.flatMap((option) =>
  option.shape.type instanceof z.ZodLiteral
    ? [...option.shape.type.values]
    : option.shape.type.options,
);

export const formPageSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().optional(),
  visibleIf: conditionSchema.optional(),
  elements: z.array(formElementSchema).max(MAX_ELEMENTS_PER_PAGE),
});

export const formSchemaObject = z
  .object({
    pages: z.array(formPageSchema).min(1).max(MAX_PAGES),
  })
  .superRefine((schema, ctx) => {
    validateUniqueElementNames(schema.pages, ctx);
  });

function validateUniqueElementNames(
  pages: FormSchema["pages"],
  ctx: z.RefinementCtx,
) {
  const names = new Set<string>();

  pages.forEach((page, pageIndex) => {
    page.elements.forEach((element, elementIndex) => {
      if (names.has(element.name)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate element name: "${element.name}"`,
          path: ["pages", pageIndex, "elements", elementIndex, "name"],
        });
      }

      names.add(element.name);
    });
  });
}

export type FormSchema = z.infer<typeof formSchemaObject>;
