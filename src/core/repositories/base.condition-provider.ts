import { SqlCondition } from "@/core/database/sql-condition.interface.js";
import { MetadataAccessor } from "@/core/database/metdata-accessor.js";

export abstract class BaseConditionProvider<
  TEntity extends object,
> extends MetadataAccessor<TEntity> {
  private readonly conditions: SqlCondition[] = [];

  protected constructor(
    protected override readonly metadata: {
      tableName: string;
      columns: Record<string, string | undefined>;
    },
  ) {
    super();
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
}
