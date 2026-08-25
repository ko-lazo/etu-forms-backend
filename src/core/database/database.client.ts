import { finished } from "node:stream/promises";
import type { Pool, QueryResultRow } from "pg";
import QueryStream from "pg-query-stream";

export class DatabaseClient {
  constructor(private readonly pool: Pool) {}

  public async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
    columns?: Record<string, string | undefined>,
  ): Promise<T[]> {
    const result = await this.pool.query<QueryResultRow>(sql, params);
    return columns
      ? result.rows.map((row) => this.mapToEntity<T>(row, columns))
      : (result.rows as unknown as T[]);
  }

  public async queryOne<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
    columns?: Record<string, string | undefined>,
  ): Promise<T | null> {
    const result = await this.pool.query<QueryResultRow>(sql, params);
    const row = result.rows[0];
    if (!row) return null;
    return columns ? this.mapToEntity<T>(row, columns) : (row as unknown as T);
  }

  public async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.pool.query(sql, params);
  }

  /**
   * Построчно читает тяжелые запросы.
   * Автоматически управляет соединением и уничтожает поток после обработки.
   */
  public async *stream<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
    options: { batchSize?: number } = {},
  ): AsyncGenerator<T> {
    const stream = new QueryStream(sql, params, options);
    const client = await this.pool.connect();

    try {
      yield* client.query(stream);
    } finally {
      stream.destroy();
      await finished(stream).catch(() => undefined);
      client.release();
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
