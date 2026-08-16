import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import ExcelJS from "exceljs";

import type { FormSchema } from "@/modules/form/schema/form-schema.schema.js";

import type {
  ExportColumn,
  ExportedResponseRow,
  WriteWorkbookOptions,
} from "./export.types.js";

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Наполняет XLSX workbook строками
 * @returns число записанных строк
 */
export async function writeWorkbook({
  output,
  rows,
  columns,
  signal,
  onProgress,
}: WriteWorkbookOptions): Promise<number> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: output,
    useStyles: false,
    useSharedStrings: false,
  });

  const sheet = workbook.addWorksheet("Ответы");

  sheet.columns = [
    { header: "ID", width: 38 },
    { header: "Создан", width: 22 },
    { header: "Отправлен", width: 22 },
    ...columns.map((column) => ({ header: column.label, width: 28 })),
  ];

  let processed = 0;

  const writer = new Writable({
    objectMode: true,
    write: (row: ExportedResponseRow, _encoding, callback) => {
      try {
        sheet.addRow(toRowValues(row, columns)).commit();

        processed += 1;
        onProgress(processed);

        callback();
      } catch (error) {
        callback(error as Error);
      }
    },
  });

  await pipeline(rows, writer, { signal });

  await workbook.commit();

  return processed;
}

/**
 * Собирает список колонок для Excel из JSON-схемы формы
 */
export function collectColumns(schema: FormSchema): ExportColumn[] {
  return schema.pages.flatMap((page) =>
    page.elements.map((element) => ({
      name: element.name,
      label: element.label,
    })),
  );
}

/**
 * Формирует имя файла
 */
export function buildFileName(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeTitle = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 80);

  return `${safeTitle || "form"}-${date}.xlsx`;
}

/**
 * Превращает сырую строку ответа на форму из БД в массив значений для вставки в Excel
 */
function toRowValues(
  row: ExportedResponseRow,
  columns: readonly ExportColumn[],
): unknown[] {
  return [
    row.id,
    row.createdAt,
    row.submittedAt,
    ...columns.map((column) => formatAnswer(row.answers[column.name])),
  ];
}

/**
 * Приводит разные типы ответов к плоскому виду
 */
function formatAnswer(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null;

  if (Array.isArray(value)) return value.join(", ");

  if (typeof value === "object") return JSON.stringify(value);

  return value as string | number | boolean;
}
