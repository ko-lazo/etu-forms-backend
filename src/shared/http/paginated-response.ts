export interface IPaginatedResult<TEntity> {
  data: TEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Only the page window is needed, so this stays independent of the repository
 * layer and shared/ keeps depending on nothing above it.
 */
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
