import type { Pool, QueryResultRow } from "pg";
import { RepositoryMetadata } from "../repositories/repository.metadata";

export class DatabaseClient<TEntity extends QueryResultRow> {
  constructor(
    private readonly pool: Pool,
    private readonly metadata: Pick<RepositoryMetadata<TEntity, object, object>, "columns">,
  ) {}

  public async query(sql: string, params: unknown[] = []): Promise<TEntity[]> {
    const result = await this.pool.query<QueryResultRow>(sql, params);
    return result.rows.map((row) => this.mapToEntity(row));
  }

  public async queryOne(sql: string, params: unknown[] = []): Promise<TEntity | null> {
    const result = await this.pool.query<QueryResultRow>(sql, params);
    const row = result.rows[0];
    return row ? this.mapToEntity(row) : null;
  }

  public async execute(sql: string, params: unknown[] = []): Promise<void> {
    await this.pool.query(sql, params);
  }

  private mapToEntity(row: QueryResultRow): TEntity {
    const entity = {} as Record<string, unknown>;
    for (const [property, dbColumn] of Object.entries(this.metadata.columns)) {
      if (dbColumn) entity[property] = row[dbColumn];
    }
    return entity as TEntity;
  }
}
