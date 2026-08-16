import { finished } from "node:stream/promises";
import type { Pool, PoolClient, QueryResultRow } from "pg";
import QueryStream from "pg-query-stream";

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
   * Стримит результаты SQL-запроса через асинхронный генератор.
   * Автоматически управляет соединением и уничтожает поток после обработки.
   */
  public async *stream<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
    options: { batchSize?: number } = {},
  ): AsyncGenerator<T> {
    if (!isPool(this.queryable)) {
      throw new Error("No pool is presented for dedicated connection");
    }

    const client = await this.queryable.connect();
    const stream = client.query(new QueryStream(sql, params, options));

    try {
      yield* stream;
    } finally {
      stream.destroy();
      await finished(stream).catch(() => undefined);
      client.release();
    }
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
      return await fn(this);
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

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
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
