import { BasePagination } from "@/core/repositories/base.pagination.js";

export interface IPaginatedResult<TEntity> {
  data: TEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class PaginatedResponse {
  public static create<T>(
    data: T[],
    total: number,
    pagination: BasePagination,
  ): IPaginatedResult<T> {
    return {
      data,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}
