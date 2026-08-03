export interface SqlCondition {
  sql: string;
  params: unknown[];
}

export interface IConditionProvider {
  apply(): SqlCondition[];
}
