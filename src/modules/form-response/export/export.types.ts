import type { Writable } from "node:stream";

import type { FormResponseExportRow } from "../form-response.types.js";

export type ExportColumn = {
  readonly name: string;
  readonly label: string;
};

export type WriteExportOptions = {
  /** Куда пишем заготовку. Writer сам закрывает этот поток */
  readonly output: Writable;

  /** Откуда берём строки для записи в файл */
  readonly rows: AsyncIterable<FormResponseExportRow>;

  /** Колонки ответов */
  readonly columns: readonly ExportColumn[];

  readonly signal: AbortSignal;

  /** Вызывается после каждой строки с их накопленным числом */
  readonly onProgress: (processed: number) => void;
};

/**
 * Контракт для writer: знает только про потоки и свой формат
 * @returns число записанных строк
 */
export type ExportWriter = (options: WriteExportOptions) => Promise<number>;

export type ExportFormatSpec = {
  readonly mime: string;
  readonly extension: string;
  readonly write: ExportWriter;

  /** Максимум допустимых ячеек */
  readonly maxCells: number;
};
