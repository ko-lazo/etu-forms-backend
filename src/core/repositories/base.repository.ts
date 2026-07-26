import type { Pool, QueryResultRow } from "pg";
import type { Repository } from "./repository.interface";
import type { RepositoryMetadata } from "./repository.metadata";

// todo refactor?
export abstract class BaseRepository<
  TEntity extends QueryResultRow,
  TCreate extends object,
  TUpdate extends object,
> implements Repository<TEntity, TCreate, TUpdate> {
  protected constructor(
    private readonly pool: Pool,
    protected readonly metadata: RepositoryMetadata<TEntity, TCreate, TUpdate>,
  ) {}

  protected readonly db = {
    query: async (sql: string, params: unknown[] = []): Promise<TEntity[]> => {
      const result = await this.pool.query<QueryResultRow>(sql, params);
      return result.rows.map((row) => this.mapToEntity(row));
    },
    queryOne: async (
      sql: string,
      params: unknown[] = [],
    ): Promise<TEntity | null> => {
      const result = await this.pool.query<QueryResultRow>(sql, params);
      return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    },
    execute: async (sql: string, params: unknown[] = []): Promise<void> => {
      await this.pool.query(sql, params);
    },
  };

  async findById(id: string): Promise<TEntity | null> {
    const primaryKey = this.getColumn(this.metadata.primaryKey);
    return this.db.queryOne(
      `SELECT * FROM ${this.tableName} WHERE ${primaryKey} = $1 LIMIT 1`,
      [id],
    );
  }

  async findAll(): Promise<TEntity[]> {
    return this.db.query(`SELECT * FROM ${this.tableName}`);
  }

  async create(data: TCreate): Promise<TEntity> {
    const entries = this.getAllowedEntries(
      data,
      this.metadata.creatableColumns,
    );
    const columns = entries.map(([property]) => this.getColumn(property));
    const values = entries.map(([property, value]) =>
      this.prepareValue(property, value),
    );
    const placeholders = values.map((_, index) => `$${index + 1}`);

    return (await this.db.queryOne(
      `
                INSERT INTO ${this.tableName} (${columns.join(", ")})
                VALUES (${placeholders.join(", ")})
                RETURNING *
            `,
      values,
    ))!;
  }

  async createMany(data: readonly TCreate[]): Promise<TEntity[]> {
    if (data.length === 0) return [];

    const columns = this.metadata.creatableColumns;
    const values: unknown[] = [];
    const rows = data.map((item, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        const rawValue = item[column as keyof TCreate];
        values.push(this.prepareValue(column, rawValue));
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    const columnNames = columns.map((column) => this.getColumn(column));
    return this.db.query(
      `
            INSERT INTO ${this.metadata.tableName} (${columnNames.join(", ")})
            VALUES ${rows.join(", ")}
            RETURNING *
        `,
      values,
    );
  }

  async update(id: string, data: TUpdate): Promise<TEntity> {
    const entries = this.getAllowedEntries(
      data,
      this.metadata.updatableColumns,
    );
    if (entries.length === 0) {
      throw new Error("Update data must contain at least one field");
    }

    const assignments = entries.map(
      ([property], index) => `${this.getColumn(property)} = $${index + 1}`,
    );
    const values = entries.map(([property, value]) =>
      this.prepareValue(property, value),
    );
    const primaryKey = this.getColumn(this.metadata.primaryKey);

    const entity = await this.db.queryOne(
      `
        UPDATE ${this.tableName}
        SET ${assignments.join(", ")}
        WHERE ${primaryKey} = $${values.length + 1}
          RETURNING *
      `,
      [...values, id],
    );

    if (!entity) {
      throw new Error(`${this.tableName} entity not found`);
    }

    return entity;
  }

  async delete(id: string): Promise<void> {
    const primaryKey = this.getColumn(this.metadata.primaryKey);
    await this.db.execute(
      `DELETE FROM ${this.tableName} WHERE ${primaryKey} = $1`,
      [id],
    );
  }

  protected getColumn(property: keyof TEntity): string {
    const column = this.metadata.columns[property];
    if (!column) {
      throw new Error(
        `Column mapping not found for property "${String(property)}"`,
      );
    }
    return column;
  }

  private getAllowedEntries<TInput extends object>(
    data: TInput,
    allowedProperties: readonly (keyof TEntity)[],
  ): [keyof TEntity, unknown][] {
    return Object.entries(data)
      .filter(([property]) =>
        allowedProperties.includes(property as keyof TEntity),
      )
      .map(([property, value]) => [property as keyof TEntity, value]);
  }

  private get tableName(): string {
    return this.metadata.tableName;
  }

  private prepareValue(property: keyof TEntity, value: unknown): unknown {
    if (value === undefined || value === null) return null;

    const isJson = this.metadata.jsonColumns?.includes(property);
    if (isJson && typeof value === "object") {
      return JSON.stringify(value);
    }
    return value;
  }

  private mapToEntity(row: QueryResultRow): TEntity {
    const entity = {} as Record<string, unknown>;
    for (const [property, dbColumn] of Object.entries(this.metadata.columns)) {
      if (dbColumn) {
        entity[property] = row[dbColumn];
      }
    }
    return entity as TEntity;
  }
}
