import type { QueryResultRow } from "pg";
import { SqlCondition } from "@/core/database/sql-condition.interface.js";
import { BasePagination } from "@/core/repositories/base.pagination.js";
import { MetadataAccessor } from "@/core/database/metdata-accessor.js";
import { RepositoryMetadata } from "@/core/repositories/repository.metadata.js";

export class SqlQueryBuilder<
  TEntity extends QueryResultRow,
  TCreate extends object,
  TUpdate extends object,
> {
  private readonly metadata: RepositoryMetadata<TEntity, TCreate, TUpdate>;

  public constructor(
    private readonly metadataAccessor: MetadataAccessor<
      TEntity,
      TCreate,
      TUpdate
    >,
  ) {
    this.metadata = metadataAccessor.metadata;
  }

  public count(conditions: SqlCondition[]): { sql: string; values: unknown[] } {
    const { sql: whereClause, values } = this.buildWhere(conditions);
    return {
      sql: `SELECT COUNT(*) as count FROM ${this.metadata.tableName} ${whereClause}`,
      values,
    };
  }

  public all(
    conditions: SqlCondition[],
    pagination?: BasePagination,
  ): { sql: string; values: unknown[] } {
    const { sql: whereClause, values } = this.buildWhere(conditions);

    const orderClause = `ORDER BY ${this.col(this.metadata.defaultOrder.column)} ${this.metadata.defaultOrder.direction}`;
    const nextIndex = values.length + 1;
    const paginationClause = pagination
      ? `LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`
      : "";
    const paginationData = pagination
      ? [pagination?.limit, pagination?.offset]
      : [];

    return {
      sql: `SELECT * FROM ${this.metadata.tableName} ${whereClause} ${orderClause} ${paginationClause}`,
      values: [...values, ...paginationData],
    };
  }

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
    const columns = entries.map(([prop]) => this.col(prop));
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
      ([prop], i) => `${this.col(prop)} = $${i + 1}`,
    );
    const values = entries.map(([prop, val]) => this.prepare(prop, val));

    return {
      sql: `UPDATE ${this.metadata.tableName} SET ${assignments.join(", ")} WHERE ${this.col(this.metadata.primaryKey)} = $${values.length + 1} RETURNING *`,
      values: [...values, id],
    };
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

  private col(property: keyof TEntity): string {
    return this.metadataAccessor.col(property);
  }
}
