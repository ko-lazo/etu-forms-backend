import type { JobArtifact, JobResult } from "./job.types.js";

/**
 * Извлекает описание результирующего файла (артефакта) из сохранённого результата задачи
 * и гарантирует наличие всех необходимых для скачивания метаданных (ключ, имя, размер, mime-тип)
 *
 * @param result Сырой JSONB-результат успешного выполнения задачи из БД
 * @returns Метаданные файла для работы с хранилищем или null, если артефакт отсутствует или повреждён
 */
export function readArtifact(result: JobResult | null): JobArtifact | null {
  if (!result) return null;

  const artifact = result["artifact"];

  if (typeof artifact !== "object" || artifact === null) return null;

  const { key, name, size, mimeType } = artifact as Record<string, unknown>;

  if (
    typeof key !== "string" ||
    typeof name !== "string" ||
    typeof size !== "number" ||
    typeof mimeType !== "string"
  ) {
    return null;
  }

  return { key, name, size, mimeType };
}
