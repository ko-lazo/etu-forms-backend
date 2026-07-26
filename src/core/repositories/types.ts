export type ColumnMap<TEntity> = {
  [K in keyof TEntity]?: string;
};
