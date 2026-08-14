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
    await this.queryable.query(sql, params);
  }

  /**
   * Выделенное соединение, необходимо для `pg-query-stream`
   */
  public async withClient<T>(
    fn: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    if (!isPool(this.queryable)) {
      throw new Error("No pool is presented for dedicated connection");
    }

    const client = await this.queryable.connect();

    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }

  /**
   * Выполняет функцию в рамках одной транзакции на выделенном соединении,
   * переиспользуя внешнюю транзакцию без открытия новой
   */
  public async withTransaction<T>(
    fn: (tx: DatabaseClient) => Promise<T>,
  ): Promise<T> {
    if (!isPool(this.queryable)) {
      return fn(this);
    }

    const client = await this.queryable.connect();
    const transactional = new DatabaseClient(client);

    let brokenConnection: Error | undefined;

    try {
      await client.query("BEGIN");
      const result = await fn(transactional);
      await client.query("COMMIT");

      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        brokenConnection =
          rollbackError instanceof Error
            ? rollbackError
            : new Error(String(rollbackError));
      }

      throw error;
    } finally {
      client.release(brokenConnection);
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
