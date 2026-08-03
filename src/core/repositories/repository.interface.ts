import { IConditionProvider } from "@/core/database/sql-condition.interface.js";

export interface Repository<TEntity, TCreate, TUpdate> {
  create(data: TCreate): Promise<TEntity>;

  findById(id: string): Promise<TEntity | null>;

  findAll(options?: FindAllOptions): Promise<TEntity[]>;

  update(id: string, data: TUpdate): Promise<TEntity>;

  delete(id: string): Promise<void>;
}

export interface FindAllOptions {
  scope?: IConditionProvider;
  filter?: IConditionProvider;
}
