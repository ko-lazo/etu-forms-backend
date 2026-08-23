import type { FormSchema } from "@/modules/form/index.js";
import type {
  FormResponseAnswer as Answer,
  FormResponseAnswers as Answers,
} from "./form-response.types.js";

type TextElementType = "text" | "email" | "textarea";
type ChoiceElementType = "dropdown" | "radiogroup" | "checkbox";

type FormElement = FormSchema["pages"][number]["elements"][number];
type TextElement = Extract<FormElement, { type: TextElementType }>;
type NumberElement = Extract<FormElement, { type: "number" }>;
type ChoiceElement = Extract<FormElement, { type: ChoiceElementType }>;

export const FORM_RESPONSE_ERROR = {
  REQUIRED: "REQUIRED",
  UNKNOWN_FIELD: "UNKNOWN_FIELD",
  INVALID_TYPE: "INVALID_TYPE",
  INVALID_EMAIL: "INVALID_EMAIL",
  TOO_SHORT: "TOO_SHORT",
  TOO_LONG: "TOO_LONG",
  TOO_SMALL: "TOO_SMALL",
  TOO_LARGE: "TOO_LARGE",
  INVALID_CHOICE: "INVALID_CHOICE",
} as const;

export type FormResponseErrorCode =
  (typeof FORM_RESPONSE_ERROR)[keyof typeof FORM_RESPONSE_ERROR];

export interface FormResponseValidationError {
  field: string;
  code: FormResponseErrorCode;
  message: string;
  params?: Record<string, string | number>;
}

export type FormResponseValidationOptions = {
  isDraft?: boolean;
};

function collectElements(schema: FormSchema): FormElement[] {
  return schema.pages.flatMap((page) => page.elements);
}

export function validateFormResponse(
  schema: FormSchema,
  answers: Answers,
  options: FormResponseValidationOptions = {},
): FormResponseValidationError[] {
  const { isDraft = false } = options;
  const elements = collectElements(schema);
  const errors: FormResponseValidationError[] = [];

  for (const element of elements) {
    const answer = answers[element.name];

    // todo учитывать element.visibleIf: скрытые поля валидируются как обычные
    // const visible = evaluateCondition(
    //   element.visibleIf,
    //   answers,
    // );
    //
    // if (!visible) {
    //   continue;
    // }

    if (!isAnswered(answer)) {
      if (element.required && !isDraft) {
        errors.push({
          field: element.name,
          code: FORM_RESPONSE_ERROR.REQUIRED,
          message: "This field is required",
        });
      }

      continue;
    }

    if (isDraft) continue;
    validateElementAnswer(element, answer, errors);
  }

  errors.push(...validateFieldNames(elements, answers));

  return errors;
}

function isAnswered(answer: Answer | undefined): answer is Answer {
  if (answer === undefined) return false;
  if (typeof answer === "string") return answer.trim() !== "";

  return Array.isArray(answer) ? answer.length > 0 : true;
}

function validateFieldNames(
  elements: FormElement[],
  answers: Answers,
): FormResponseValidationError[] {
  const elementNames = new Set(elements.map((element) => element.name));

  return Object.keys(answers)
    .filter((fieldName) => !elementNames.has(fieldName))
    .map((fieldName) => ({
      field: fieldName,
      code: FORM_RESPONSE_ERROR.UNKNOWN_FIELD,
      message: `Unknown field: "${fieldName}"`,
    }));
}

function validateElementAnswer(
  element: FormElement,
  answer: Answer,
  errors: FormResponseValidationError[],
): void {
  switch (element.type) {
    case "text":
    case "email":
    case "textarea":
      validateTextAnswer(element, answer, errors);
      return;

    case "number":
      validateNumberAnswer(element, answer, errors);
      return;

    case "dropdown":
    case "radiogroup":
      validateSingleChoiceAnswer(element, answer, errors);
      return;

    case "checkbox":
      validateCheckboxAnswer(element, answer, errors);
      return;

    // todo files
    // case "file":
    //   validateFileAnswer(element, answer, errors);
    //   return;
  }
}

function validateTextAnswer(
  element: TextElement,
  answer: Answer,
  errors: FormResponseValidationError[],
): void {
  if (typeof answer !== "string") {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.INVALID_TYPE,
      message: "Answer must be a string",
      params: { expected: "string" },
    });

    return;
  }

  const validation = element.validation;

  if (
    validation?.minLength !== undefined &&
    answer.length < validation.minLength
  ) {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.TOO_SHORT,
      message: `Answer must contain at least ${validation.minLength} characters`,
      params: { minLength: validation.minLength },
    });
  }

  if (
    validation?.maxLength !== undefined &&
    answer.length > validation.maxLength
  ) {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.TOO_LONG,
      message: `Answer must contain at most ${validation.maxLength} characters`,
      params: { maxLength: validation.maxLength },
    });
  }

  if (element.type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(answer)) {
      errors.push({
        field: element.name,
        code: FORM_RESPONSE_ERROR.INVALID_EMAIL,
        message: "Answer must be a valid email address",
      });
    }
  }
}

function validateNumberAnswer(
  element: NumberElement,
  answer: Answer,
  errors: FormResponseValidationError[],
): void {
  if (typeof answer !== "number" || !Number.isFinite(answer)) {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.INVALID_TYPE,
      message: "Answer must be a number",
      params: { expected: "number" },
    });

    return;
  }

  const validation = element.validation;

  if (validation?.min !== undefined && answer < validation.min) {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.TOO_SMALL,
      message: `Answer must be at least ${validation.min}`,
      params: { min: validation.min },
    });
  }

  if (validation?.max !== undefined && answer > validation.max) {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.TOO_LARGE,
      message: `Answer must be at most ${validation.max}`,
      params: { max: validation.max },
    });
  }
}

function validateSingleChoiceAnswer(
  element: ChoiceElement,
  answer: Answer,
  errors: FormResponseValidationError[],
): void {
  if (typeof answer !== "string") {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.INVALID_TYPE,
      message: "Answer must be a string",
      params: { expected: "string" },
    });

    return;
  }

  const allowedValues = new Set(element.choices.map((choice) => choice.value));

  if (!allowedValues.has(answer)) {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.INVALID_CHOICE,
      message: `Invalid choice: "${answer}"`,
      params: { value: answer },
    });
  }
}

function validateCheckboxAnswer(
  element: ChoiceElement,
  answer: Answer,
  errors: FormResponseValidationError[],
): void {
  if (!Array.isArray(answer)) {
    errors.push({
      field: element.name,
      code: FORM_RESPONSE_ERROR.INVALID_TYPE,
      message: "Answer must be an array",
      params: { expected: "array" },
    });

    return;
  }

  const allowedValues = new Set(element.choices.map((choice) => choice.value));

  for (const value of answer) {
    if (!allowedValues.has(value)) {
      errors.push({
        field: element.name,
        code: FORM_RESPONSE_ERROR.INVALID_CHOICE,
        message: `Invalid choice: "${value}"`,
        params: { value },
      });
    }
  }
}

// todo files
// function validateFileAnswer(
//   element: FileElement,
//   answer: Answer,
//   errors: FormResponseValidationError[],
// ): void {
//
//   if (typeof answer === "string") {
//     return;
//   }
//
//   if (!Array.isArray(answer)) {
//     errors.push({
//       field: element.name,
//       message: "Invalid file answer",
//     });
//
//     return;
//   }
//
//   const maxFilesCount = element.validation?.maxFilesCount ?? 1;
//
//   if (answer.length > maxFilesCount) {
//     errors.push({
//       field: element.name,
//       message: `Maximum ${maxFilesCount} files allowed`,
//     });
//   }
// }
