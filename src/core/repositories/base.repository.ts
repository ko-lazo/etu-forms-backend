import type { Pool, QueryResultRow } from "pg";
import type { FindContext, Repository } from "./repository.interface.js";
import type { RepositoryMetadata } from "./repository.metadata.js";
import { SqlQueryBuilder } from "./repository.sql-builder.js";
import { DatabaseClient } from "@/core/database/database.client.js";
import { MetadataAccessor } from "@/core/database/metdata-accessor.js";

export abstract class BaseRepository<
  TEntity extends QueryResultRow,
  TCreate extends object,
  TUpdate extends object,
> implements Repository<TEntity, TCreate, TUpdate> {
  protected readonly db: DatabaseClient;
  private readonly queryBuilder: SqlQueryBuilder<TEntity, TCreate, TUpdate>;
  private readonly metadataAccessor: MetadataAccessor<
    TEntity,
    TCreate,
    TUpdate
  >;

  protected constructor(
    db: DatabaseClient,
    protected readonly metadata: RepositoryMetadata<TEntity, TCreate, TUpdate>,
  ) {
    this.db = db;
    this.metadataAccessor = new MetadataAccessor(metadata);
    this.queryBuilder = new SqlQueryBuilder(this.metadataAccessor);
  }

  protected get table(): string {
    return this.metadata.tableName;
  }

  async findById(id: string): Promise<TEntity | null> {
    return this.db.queryOne<TEntity>(
      `SELECT * FROM ${this.table} WHERE ${this.col(this.metadata.primaryKey)} = $1 LIMIT 1`,
      [id],
      this.metadata.columns,
    );
  }

  async findAll(
    options?: FindContext<TEntity>,
  ): Promise<{ entities: TEntity[]; total: number }> {
    const conditions = [
      ...(options?.scope?.apply() ?? []),
      ...(options?.filter?.apply() ?? []),
    ];

    const dataQuery = this.queryBuilder.all(conditions, options?.pagination);
    const countQuery = this.queryBuilder.count(conditions);

    const [dataResult, countResult] = await Promise.all([
      this.db.query<TEntity>(
        dataQuery.sql,
        dataQuery.values,
        this.metadata.columns,
      ),
      this.db.query<{ count: string }>(countQuery.sql, countQuery.values),
    ]);

    const firstRow = countResult[0];
    const totalCount = firstRow ? parseInt(firstRow.count, 10) : 0;

    return {
      entities: dataResult,
      total: isNaN(totalCount) ? 0 : totalCount,
    };
  }

  async create(data: TCreate): Promise<TEntity> {
    const { sql, values } = this.queryBuilder.insert(data);
    return (await this.db.queryOne<TEntity>(
      sql,
      values,
      this.metadata.columns,
    ))!;
  }

  async update(id: string, data: TUpdate): Promise<TEntity> {
    const { sql, values } = this.queryBuilder.update(id, data);
    const entity = await this.db.queryOne<TEntity>(
      sql,
      values,
      this.metadata.columns,
    );

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

  protected col(property: keyof TEntity): string {
    return this.metadataAccessor.col(property);
  }
}
