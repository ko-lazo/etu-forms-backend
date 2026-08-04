import { BaseConditionProvider } from "@/core/repositories/base.condition-provider.js";

export abstract class BaseScope<
  TEntity extends object,
> extends BaseConditionProvider<TEntity> {}
