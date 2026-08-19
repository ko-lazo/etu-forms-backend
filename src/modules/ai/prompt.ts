import { readFile } from "node:fs/promises";
import path from "node:path";

import { aiConfig } from "@/config/index.js";

const placeholderPattern = /\{\{(\w+)}}/g;

/**
 * Читает .md шаблон и подставляет переданные значения в плейсхолдеры
 * @param fileName Имя файла
 * @param values Объект вида плейсхолдер: значение
 */
export async function renderPrompt(
  fileName: string,
  values: Record<string, string> = {},
): Promise<string> {
  const template = await readFile(
    path.join(aiConfig.promptsDir, fileName),
    "utf8",
  );

  return template
    .trim()
    .replace(
      placeholderPattern,
      (placeholder, key: string) => values[key] ?? placeholder,
    );
}
