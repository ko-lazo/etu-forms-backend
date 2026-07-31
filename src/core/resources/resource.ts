export interface Resource<TEntity, TResponse> {
  one(entity: TEntity): TResponse;

  many(entities: readonly TEntity[]): TResponse[];
}
