import { MetadataAccessor } from "@/core/database/metdata-accessor.js";
import {
  IConditionProvider,
  SqlCondition,
} from "@/core/database/sql-condition.interface.js";

export abstract class BaseFilter<TEntity extends object>
  extends MetadataAccessor<TEntity>
  implements IConditionProvider
{
  private readonly conditions: SqlCondition[] = [];

  protected add(sql: string, ...params: unknown[]) {
    this.conditions.push({
      sql,
      params,
    });
  }

  apply() {
    return this.conditions;
  }
}
