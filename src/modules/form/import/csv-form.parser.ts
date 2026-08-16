import { z } from "zod";
import { formElementSchema } from "@/modules/form/schema/form-schema.schema.js";

export type CsvRowError = {
  readonly line: number;
  readonly message: string;
  readonly details?: unknown;
};

export type ParsedElement = z.infer<typeof formElementSchema>;

export type CsvRowResult =
  | { readonly ok: true; readonly element: ParsedElement }
  | {
      readonly ok: false;
      readonly message: string;
      readonly details?: unknown;
    };

const TRUE_VALUES = new Set(["1", "true", "yes", "y", "да", "истина", "+"]);

/**
 *
 *
 * @example
 *   name,label,type,required,placeholder,choices
 *   fullName,ФИО,text,true,Иванов Иван,
 *   skills,Навыки,checkbox,false,,js:JavaScript|sql:SQL
 *
 * @remarks
 *   `choices` заполняется только для dropdown/radiogroup/checkbox:
 *   пары `значение:подпись`, разделённые `|`. Если двоеточия нет,
 *   значение и подпись совпадают.
 */
export function csvRowToElement(row: Record<string, string>): CsvRowResult {
  const get = (key: string): string => (row[key] ?? "").trim();

  const name = get("name");
  const label = get("label");
  const type = get("type").toLowerCase();

  if (!name && !label && !type) {
    return { ok: false, message: "Пустая строка" };
  }

  const candidate: Record<string, unknown> = {
    name,
    label,
    type,
    required: TRUE_VALUES.has(get("required").toLowerCase()),
  };

  const placeholder = get("placeholder");
  if (placeholder) {
    candidate["placeholder"] = placeholder;
  }

  const choices = parseChoices(get("choices"));
  if (choices.length > 0) {
    candidate["choices"] = choices;
  }

  const parsed = formElementSchema.safeParse(candidate);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Строка не проходит валидацию вопроса",
      details: z.treeifyError(parsed.error),
    };
  }

  return { ok: true, element: parsed.data };
}

function parseChoices(raw: string): { value: string; text: string }[] {
  if (!raw) return [];

  return raw
    .split("|")
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const separator = chunk.indexOf(":");

      if (separator === -1) {
        return { value: chunk, text: chunk };
      }

      return {
        value: chunk.slice(0, separator).trim(),
        text: chunk.slice(separator + 1).trim(),
      };
    });
}

/**
 * Проверяет имена вопросов внутри формы на уникальность
 */
export function findDuplicateNames(elements: ParsedElement[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const element of elements) {
    if (seen.has(element.name)) {
      duplicates.add(element.name);
    }
    seen.add(element.name);
  }

  return [...duplicates];
}

export function normalizeRow(
  row: Record<string, string>,
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(row)) {
    normalized[key.trim().toLowerCase()] = value;
  }

  return normalized;
}
