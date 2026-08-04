import { BaseScope } from "@/core/repositories/base.scope.js";
import { BaseFilter } from "@/core/repositories/base.filter.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";

export interface Repository<TEntity extends object, TCreate, TUpdate> {
  create(data: TCreate): Promise<TEntity>;

  findById(id: string): Promise<TEntity | null>;

  findAll(options?: FindContext<TEntity>): Promise<TEntity[]>;

  update(id: string, data: TUpdate): Promise<TEntity>;

  delete(id: string): Promise<void>;
}

export interface FindContext<TEntity extends object> {
  scope?: BaseScope<TEntity>;
  filter?: BaseFilter<TEntity>;
  pagination?: BasePagination;
}

export interface PaginationQuery {
  page?: number | undefined;
  limit?: number | undefined;
}
