import { z } from "zod";
import { paginationQuerySchema } from "./pagination.schema.js";

export interface ModuleDto<
  TCreateSchema extends z.ZodType,
  TUpdateSchema extends z.ZodType,
  TResponseSchema extends z.ZodType,
> {
  /** Схема валидации при создании экземпляра */
  readonly createSchema: TCreateSchema;

  /** Схема валидации при обновлении экземпляра */
  readonly updateSchema?: TUpdateSchema;

  /** Схема валидации и очистки данных при отправке */
  readonly responseSchema: TResponseSchema;

  /** Схема запроса для GET / */
  readonly findSchema?: TResponseSchema;
}

/** Базовая findSchema с метаданными пагинации */
export function createFindSchema<T extends z.ZodRawShape>(
  filtersObj: T = {} as T,
) {
  return z.object({
    ...filtersObj,
    ...paginationQuerySchema.shape,
  });
}
