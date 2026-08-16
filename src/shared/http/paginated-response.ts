export interface IPaginatedResult<TEntity> {
  data: TEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  pagination: { readonly page: number; readonly limit: number },
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
