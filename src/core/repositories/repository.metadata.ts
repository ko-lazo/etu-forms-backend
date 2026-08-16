import { type QueryResultRow } from "pg";
import { type ColumnMap } from "./types.js";

type StringKeyOf<T> = Extract<keyof T, string>;

type OrderDirection = "ASC" | "DESC" | "asc" | "desc";

export type RepositoryMetadata<
  TEntity extends QueryResultRow,
  TCreate extends Partial<TEntity>,
  TUpdate extends object,
> = {
  readonly tableName: string;

  readonly primaryKey: keyof TEntity;

  readonly defaultOrder: {
    readonly column: keyof TEntity;
    readonly direction: OrderDirection;
  };

  readonly columns: ColumnMap<TEntity>;

  readonly creatableColumns: readonly StringKeyOf<TCreate>[];

  readonly updatableColumns: readonly StringKeyOf<TUpdate>[];

  readonly jsonColumns?: readonly (keyof TEntity)[];
};
