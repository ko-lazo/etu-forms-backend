import { type BaseScope } from "@/core/repositories/base.scope.js";
import { type BaseFilter } from "@/core/repositories/base.filter.js";
import { type BasePagination } from "@/core/repositories/base.pagination.js";

export interface Repository<TEntity extends object, TCreate, TUpdate> {
  create(data: TCreate): Promise<TEntity>;

  findById(id: string): Promise<TEntity | null>;

  findAll(
    options?: FindContext<TEntity>,
  ): Promise<{ entities: TEntity[]; total: number }>;

  update(id: string, data: TUpdate): Promise<TEntity>;

  delete(id: string): Promise<void>;
}

export interface FindContext<TEntity extends object> {
  scope: BaseScope<TEntity>;
  filter?: BaseFilter<TEntity>;
  pagination?: BasePagination;
}

export interface PaginationQuery {
  page?: number | undefined;
  limit?: number | undefined;
}
