import { Repository } from '@/core/repositories/repository.interface.js';

export abstract class BaseService<TEntity, TCreate, TUpdate> {
  protected constructor(
    protected readonly repository: Repository<TEntity, TCreate, TUpdate>,
  ) {}

  create(data: TCreate): Promise<TEntity> {
    return this.repository.create(data);
  }

  findById(id: string): Promise<TEntity | null> {
    return this.repository.findById(id);
  }

  findAll(): Promise<TEntity[]> {
    return this.repository.findAll();
  }

  update(id: string, data: TUpdate): Promise<TEntity> {
    return this.repository.update(id, data);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
