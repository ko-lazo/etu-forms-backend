export interface Repository<TEntity, TCreate, TUpdate> {
  create(data: TCreate): Promise<TEntity>;

  createMany(data: TCreate[]): Promise<TEntity[]>;

  findById(id: string): Promise<TEntity | null>;

  findAll(): Promise<TEntity[]>;

  update(id: string, data: TUpdate): Promise<TEntity>;

  delete(id: string): Promise<void>;
}
