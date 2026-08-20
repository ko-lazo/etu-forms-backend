import { BaseConditionProvider } from "@/core/repositories/base.condition-provider.js";

export abstract class BaseFilter<
  TEntity extends object,
> extends BaseConditionProvider<TEntity> {
  protected dateRange(
    property: keyof TEntity,
    from: Date | undefined,
    to: Date | undefined,
  ): void {
    if (from) this.add(`${this.col(property)} >= ?`, from);
    if (to) this.add(`${this.col(property)} <= ?`, to);
  }
}
