import { type PaginationQuery } from "./repository.interface.js";

export class BasePagination {
  readonly page: number;
  readonly limit: number;
  readonly offset: number;

  constructor(dto: PaginationQuery) {
    this.page = Math.max(dto.page ?? 1, 1);
    this.limit = Math.max(dto.limit ?? 20, 1);
    this.offset = (this.page - 1) * this.limit;
  }
}
