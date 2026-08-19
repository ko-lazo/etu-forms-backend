import { readFile } from "node:fs/promises";
import path from "node:path";

import { aiConfig } from "@/config/index.js";

/**
 * Читает .md шаблон и подставляет переданные значения в плейсхолдеры
 * @param fileName Имя файла
 * @param values Объект вида плейсхолдер: значение
 */
export async function renderPrompt(
  fileName: string,
  values: Record<string, string> = {},
): Promise<string> {
  const code = "utf8";
  const regexp = "/\\{\\{(\\w+)}}/g";

  const template = await readFile(
    path.join(aiConfig.promptsRoot, fileName),
    code,
  );

  return template
    .trim()
    .replace(regexp, (placeholder, key: string) => values[key] ?? placeholder);
}
