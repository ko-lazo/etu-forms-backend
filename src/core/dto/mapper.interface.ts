import { QueryResultRow } from "pg";

/**
 * Универсальный контракт для мапперов.
 * Изолирует слой БД (TEntity) от слоя фронтенда (TResponse).
 */
export interface IMapper<TEntity extends QueryResultRow, TResponse> {
  /** Трансформация одной сущности из БД в безопасный DTO */
  toResponse(entity: TEntity): TResponse;

  /** Трансформация массива сущностей (коллекции) */
  toResponseCollection(entities: TEntity[]): TResponse[];
}
