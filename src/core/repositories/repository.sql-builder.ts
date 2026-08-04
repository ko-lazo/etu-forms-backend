import type { QueryResultRow } from "pg";
import { RepositoryMetadata } from "./repository.metadata.js";
import { SqlCondition } from "@/core/database/sql-condition.interface.js";

export class SqlQueryBuilder<
  TEntity extends QueryResultRow,
  TCreate extends object,
  TUpdate extends object,
> {
  constructor(
    private readonly metadata: RepositoryMetadata<TEntity, TCreate, TUpdate>,
  ) {}

  public buildWhere(conditions: SqlCondition[]): {
    sql: string;
    values: unknown[];
  } {
    if (conditions.length === 0) {
      return {
        sql: "",
        values: [],
      };
    }

    const values: unknown[] = [];
    let index = 1;

    const sql = conditions
      .map((condition) => {
        let fragment = condition.sql;

        for (const value of condition.params) {
          fragment = fragment.replace("?", `$${index++}`);
          values.push(value);
        }

        return `(${fragment})`;
      })
      .join(" AND ");

    return {
      sql: `WHERE ${sql}`,
      values,
    };
  }

  public insert(data: TCreate): { sql: string; values: unknown[] } {
    const entries = this.getAllowedEntries(
      data,
      this.metadata.creatableColumns,
    );
    const columns = entries.map(([prop]) => this.getCol(prop));
    const values = entries.map(([prop, val]) => this.prepare(prop, val));
    const placeholders = values.map((_, i) => `$${i + 1}`);

    return {
      sql: `INSERT INTO ${this.metadata.tableName} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
      values,
    };
  }

  public update(id: string, data: TUpdate): { sql: string; values: unknown[] } {
    const entries = this.getAllowedEntries(
      data,
      this.metadata.updatableColumns,
    );
    if (entries.length === 0)
      throw new Error("Update data must contain at least one field");

    const assignments = entries.map(
      ([prop], i) => `${this.getCol(prop)} = $${i + 1}`,
    );
    const values = entries.map(([prop, val]) => this.prepare(prop, val));

    return {
      sql: `UPDATE ${this.metadata.tableName} SET ${assignments.join(", ")} WHERE ${this.getCol(this.metadata.primaryKey)} = $${values.length + 1} RETURNING *`,
      values: [...values, id],
    };
  }

  private getCol(property: keyof TEntity): string {
    return this.metadata.columns[property]!;
  }

  private getAllowedEntries<TInput extends object>(
    data: TInput,
    allowed: readonly (keyof TEntity)[],
  ): [keyof TEntity, unknown][] {
    return Object.entries(data)
      .filter(([prop]) => allowed.includes(prop as keyof TEntity))
      .map(([prop, val]) => [prop as keyof TEntity, val]);
  }

  private prepare(property: keyof TEntity, value: unknown): unknown {
    if (value === undefined || value === null) return null;
    return this.metadata.jsonColumns?.includes(property) &&
      typeof value === "object"
      ? JSON.stringify(value)
      : value;
  }
}
