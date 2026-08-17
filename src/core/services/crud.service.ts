import {
  type FindContext,
  type Repository,
} from "@/core/repositories/repository.interface.js";

export function createCrudService<TEntity extends object, TCreate, TUpdate>(
  repository: Repository<TEntity, TCreate, TUpdate>,
) {
  return {
    findById: (id: string): Promise<TEntity | null> => repository.findById(id),

    findAll: (options?: FindContext<TEntity>) => repository.findAll(options),

    create: (data: TCreate): Promise<TEntity> => repository.create(data),

    update: (id: string, data: TUpdate): Promise<TEntity> =>
      repository.update(id, data),

    delete: (id: string): Promise<void> => repository.delete(id),
  };
}
