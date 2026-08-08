import {
  IConditionProvider,
  SqlCondition,
} from "@/core/database/sql-condition.interface.js";
import { MetadataAccessor } from "@/core/database/metdata-accessor.js";
import { DatabaseClient } from "@/core/database/database.client.js";
import type { RepositoryMetadata } from "@/core/repositories/repository.metadata.js";
import { SqlQueryBuilder } from "@/core/repositories/repository.sql-builder.js";

export abstract class BaseConditionProvider<
  TEntity extends object,
> implements IConditionProvider {
  private readonly conditions: SqlCondition[] = [];
  protected readonly metadataAccessor: MetadataAccessor<TEntity, any, any>;

  protected constructor(
    protected readonly metadata: RepositoryMetadata<TEntity, any, any>,
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
