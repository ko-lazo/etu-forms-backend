import type { Pool, QueryResultRow } from "pg";
import type { Repository } from './repository.interface.js';
import type { RepositoryMetadata } from './repository.metadata.js';
import { SqlQueryBuilder } from './repository.sql-builder.js';
import { DatabaseClient } from "@/core/database/database.client.js";

export abstract class BaseRepository<
  TEntity extends QueryResultRow,
  TCreate extends object,
  TUpdate extends object,
> implements Repository<TEntity, TCreate, TUpdate> {
  protected readonly db: DatabaseClient;
  private readonly queryBuilder: SqlQueryBuilder<TEntity, TCreate, TUpdate>;

  protected constructor(
    db: DatabaseClient,
    protected readonly metadata: RepositoryMetadata<TEntity, TCreate, TUpdate>,
  ) {
    this.db = db;
    this.queryBuilder = new SqlQueryBuilder(metadata);
  }

  protected col(property: keyof TEntity): string {
    const column = this.metadata.columns[property];
    if (!column) {
      throw new Error(
        `Column mapping not found for property "${String(property)}"`,
      );
    }
    return column;
  }

  protected get table(): string {
    return this.metadata.tableName;
  }

  async findById(id: string): Promise<TEntity | null> {
    return this.db.queryOne<TEntity>(
      `SELECT * FROM ${this.table} WHERE ${this.col(this.metadata.primaryKey)} = $1 LIMIT 1`,
      [id],
    );
  }

  async findAll(): Promise<TEntity[]> {
    return this.db.query<TEntity>(`SELECT * FROM ${this.table}`);
  }

  async create(data: TCreate): Promise<TEntity> {
    const { sql, values } = this.queryBuilder.insert(data);
    return (await this.db.queryOne<TEntity>(sql, values))!;
  }

  async update(id: string, data: TUpdate): Promise<TEntity> {
    const { sql, values } = this.queryBuilder.update(id, data);
    const entity = await this.db.queryOne<TEntity>(sql, values);

    if (!entity) {
      throw new Error(`${this.table} with id ${id} not found`);
    }
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.db.execute(
      `DELETE FROM ${this.table} WHERE ${this.col(this.metadata.primaryKey)} = $1`,
      [id],
    );
  }
}
