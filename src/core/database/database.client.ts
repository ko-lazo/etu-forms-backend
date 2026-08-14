import type { Pool, PoolClient, QueryResultRow } from "pg";

export type Queryable = Pool | PoolClient;

function isPool(queryable: Queryable): queryable is Pool {
  return "connect" in queryable;
}

export class DatabaseClient {
  constructor(private readonly queryable: Queryable) {}

  public async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
    columns?: Record<string, string | undefined>,
  ): Promise<T[]> {
    const result = await this.queryable.query<QueryResultRow>(sql, params);
    return columns
      ? result.rows.map((row) => this.mapToEntity<T>(row, columns))
      : (result.rows as unknown as T[]);
  }

  public async queryOne<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
    columns?: Record<string, string | undefined>,
  ): Promise<T | null> {
    const result = await this.queryable.query<QueryResultRow>(sql, params);
    const row = result.rows[0];
    if (!row) return null;
    return columns ? this.mapToEntity<T>(row, columns) : (row as unknown as T);
  }

  public async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.pool.query(sql, params);
    await this.queryable.query(sql, params);
  }
  }

  private mapToEntity<T>(
    row: QueryResultRow,
    columns: Record<string, string | undefined>,
  ): T {
    const entity = {} as Record<string, unknown>;
    for (const [property, dbColumn] of Object.entries(columns)) {
      if (dbColumn) entity[property] = row[dbColumn];
    }
    return entity as T;
  }
}
