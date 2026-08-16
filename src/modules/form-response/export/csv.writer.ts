import { pipeline } from "node:stream/promises";

import type { FormResponseExportRow } from "../form-response.types.js";
import { SERVICE_COLUMNS, toRowValues } from "./export-row.formatter.js";
import type { WriteExportOptions } from "./export.types.js";

const BOM = "﻿";

const SPECIAL = /[",\r\n]/;

const FORMULA = /^[=+\-@\t\r]/;

export async function writeCsv({
  output,
  rows,
  columns,
  signal,
  onProgress,
}: WriteExportOptions): Promise<number> {
  const header = [
    ...SERVICE_COLUMNS.map((column) => column.header),
    ...columns.map((column) => column.label),
  ];

  let processed = 0;

  await pipeline(
    rows,
    async function* (source: AsyncIterable<FormResponseExportRow>) {
      yield BOM + toCsvLine(header);

      for await (const row of source) {
        yield toCsvLine(toRowValues(row, columns));

        processed += 1;
        onProgress(processed);
      }
    },
    output,
    { signal },
  );

  return processed;
}

function toCsvLine(values: readonly unknown[]): string {
  return `${values.map(toCsvCell).join(",")}\r\n`;
}

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let cell = value instanceof Date ? value.toISOString() : String(value);

  if (FORMULA.test(cell)) cell = `'${cell}`;

  return SPECIAL.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
}
