import { z } from "zod";

/**
 * Единый контракт для DTO любого модуля системы.
 * Гарантирует, что у каждой сущности будут схемы для входа и выхода.
 */
export interface ModuleDto<
  TCreateSchema extends z.ZodTypeAny,
  TUpdateSchema extends z.ZodTypeAny,
  TResponseSchema extends z.ZodTypeAny,
> {
  /** Схема валидации req.body при создании */
  readonly createSchema: TCreateSchema;

  /** Схема валидации req.body при обновлении */
  readonly updateSchema: TUpdateSchema;

  /** Схема валидации и очистки данных при отправке */
  readonly responseSchema: TResponseSchema;
}
