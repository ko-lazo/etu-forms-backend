import { writeCsv } from "./csv.writer.js";
import type { ExportFormatSpec } from "./export.types.js";
import { writeWorkbook } from "./xlsx.writer.js";

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const CSV_MIME = "text/csv; charset=utf-8";

export const EXPORT_FORMATS = ["xlsx", "csv"] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const FORMAT_SPECS: Record<ExportFormat, ExportFormatSpec> = {
  xlsx: {
    mime: XLSX_MIME,
    extension: "xlsx",
    write: writeWorkbook,
    maxCells: 2_000_000,
  },

  csv: {
    mime: CSV_MIME,
    extension: "csv",
    write: writeCsv,
    maxCells: 20_000_000,
  },
};
