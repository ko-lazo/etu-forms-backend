import type { FormSchemaDto } from "@/modules/form/schema/form-schema.schema.js";

import type { FormResponseExportRow } from "../form-response.types.js";
import type { ExportColumn } from "./export.types.js";

/**
 * Служебные колонки, общие для всех форматов
 */
export const SERVICE_COLUMNS = [
  { header: "ID", width: 38, value: (row: FormResponseExportRow) => row.id },
  {
    header: "Создан",
    width: 22,
    value: (row: FormResponseExportRow) => row.createdAt,
  },
  {
    header: "Отправлен",
    width: 22,
    value: (row: FormResponseExportRow) => row.submittedAt,
  },
] as const;

/**
 * Собирает список колонок выгрузки из JSON-схемы формы
 */
export function collectColumns(schema: FormSchemaDto): ExportColumn[] {
  return schema.pages.flatMap((page) =>
    page.elements.map((element) => ({
      name: element.name,
      label: element.label,
    })),
  );
}

/**
 * Превращает сырую строку ответа из БД в массив значений по порядку колонок
 */
export function toRowValues(
  row: FormResponseExportRow,
  columns: readonly ExportColumn[],
): unknown[] {
  return [
    ...SERVICE_COLUMNS.map((column) => column.value(row)),
    ...columns.map((column) => formatAnswer(row.answers[column.name])),
  ];
}

/**
 * Приводит разные типы ответов к плоскому виду
 */
export function formatAnswer(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) return value.join(", ");

  if (typeof value === "object") return JSON.stringify(value);

  return value as string | number | boolean;
}
