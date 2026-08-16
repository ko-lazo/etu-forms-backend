import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import ExcelJS from "exceljs";

import type { FormResponseExportRow } from "../form-response.types.js";
import { SERVICE_COLUMNS, toRowValues } from "./export-row.formatter.js";
import type { WriteExportOptions } from "./export.types.js";

export async function writeWorkbook({
  output,
  rows,
  columns,
  signal,
  onProgress,
}: WriteExportOptions): Promise<number> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: output,
    useStyles: false,
    useSharedStrings: false,
  });

  const sheet = workbook.addWorksheet("Ответы");

  sheet.columns = [
    ...SERVICE_COLUMNS.map(({ header, width }) => ({ header, width })),
    ...columns.map((column) => ({ header: column.label, width: 28 })),
  ];

  let processed = 0;

  const writer = new Writable({
    objectMode: true,
    write: (row: FormResponseExportRow, _encoding, callback) => {
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
