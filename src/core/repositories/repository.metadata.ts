import { QueryResultRow } from "pg";
import { ColumnMap } from "./types";

export type StringKeyOf<T> = Extract<keyof T, string>;

export type RepositoryMetadata<
  TEntity extends QueryResultRow,
  TCreate extends object,
  TUpdate extends object,
> = {
  readonly tableName: string;

  readonly primaryKey: keyof TEntity;

  readonly columns: ColumnMap<TEntity>;

  readonly creatableColumns: readonly StringKeyOf<TCreate>[];

  readonly updatableColumns: readonly StringKeyOf<TUpdate>[];

  readonly jsonColumns?: readonly (keyof TEntity)[];
};
