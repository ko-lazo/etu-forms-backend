import { PaginationQuery } from "@/core/repositories/repository.interface.js";

export class BasePagination {
  readonly limit: number;
  readonly offset: number;

  constructor(dto: PaginationQuery) {
    const page = Math.max(dto.page ?? 1, 1);
    const limit = Math.max(dto.limit ?? 3, 1);

    this.limit = limit;
    this.offset = (page - 1) * limit;
  }
}
