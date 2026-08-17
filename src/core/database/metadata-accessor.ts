import { type RepositoryMetadata } from "@/core/repositories/repository.metadata.js";

export class MetadataAccessor<
  TEntity extends object,
  TCreate extends object = object,
  TUpdate extends object = object,
> {
  constructor(
    public readonly metadata: RepositoryMetadata<TEntity, TCreate, TUpdate>,
  ) {}

  public col(property: keyof TEntity): string {
    return `${this.metadata.tableName}.${this.rawCol(property)}`;
  }

  /**
   * Имя колонки без имени таблицы, необходимо для `SET`
   */
  public rawCol(property: keyof TEntity): string {
    const column = this.metadata.columns[property];
    if (!column) {
      throw new Error(`Unknown column "${String(property)}"`);
    }
    return column;
  }
}
