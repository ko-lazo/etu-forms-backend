import {
  FindContext,
  Repository,
} from "@/core/repositories/repository.interface.js";

export abstract class BaseService<TEntity extends object, TCreate, TUpdate> {
  protected constructor(
    protected readonly repository: Repository<TEntity, TCreate, TUpdate>,
  ) {}

  create(data: TCreate): Promise<TEntity> {
    return this.repository.create(data);
  }

  findById(id: string): Promise<TEntity | null> {
    return this.repository.findById(id);
  }

  findAll(
    options?: FindContext<TEntity>,
  ): Promise<{ entities: TEntity[]; total: number }> {
    return this.repository.findAll(options);
  }

  update(id: string, data: TUpdate): Promise<TEntity> {
    return this.repository.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
