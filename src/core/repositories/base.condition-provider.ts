import {
  type IConditionProvider,
  type SqlCondition,
} from "@/core/database/sql-condition.interface.js";
import { MetadataAccessor } from "@/core/database/metadata-accessor.js";
import type { RepositoryMetadata } from "@/core/repositories/repository.metadata.js";

export abstract class BaseConditionProvider<
  TEntity extends object,
> implements IConditionProvider {
  private readonly conditions: SqlCondition[] = [];
  protected readonly metadataAccessor: MetadataAccessor<
    TEntity,
    Partial<TEntity>,
    TEntity
  >;

  protected constructor(
    protected readonly metadata: RepositoryMetadata<
      TEntity,
      Partial<TEntity>,
      TEntity
    >,
  ) {
    this.metadataAccessor = new MetadataAccessor(metadata);
  }

  protected add(sql: string, ...params: unknown[]): void {
    this.conditions.push({
      sql,
      params,
    });
  }

  public apply(): SqlCondition[] {
    return this.conditions;
  }

  protected col(property: keyof TEntity): string {
    return this.metadataAccessor.col(property);
  }
}
