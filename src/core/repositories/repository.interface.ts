import { IConditionProvider } from "@/core/database/sql-condition.interface.js";

export interface Repository<TEntity extends object, TCreate, TUpdate> {
  create(data: TCreate): Promise<TEntity>;

  findById(id: string): Promise<TEntity | null>;

  findAll(options?: FindContext<TEntity>): Promise<TEntity[]>;

  update(id: string, data: TUpdate): Promise<TEntity>;

  delete(id: string): Promise<void>;
}

export interface FindAllOptions {
  scope?: IConditionProvider;
  filter?: IConditionProvider;
export interface FindContext<TEntity extends object> {
}
