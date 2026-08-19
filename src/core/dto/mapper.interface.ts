import { type QueryResultRow } from "pg";

/**
 * Переводит данные из БД в формат ответа клиенту (фронтенду).
 */
export interface IMapper<TEntity extends QueryResultRow, TResponse> {
  /** Трансформация одной сущности из БД в безопасный DTO */
  toResponse(entity: TEntity): TResponse;

  /** Трансформация массива сущностей (коллекции) */
  toResponseCollection(entities: TEntity[]): TResponse[];
}
