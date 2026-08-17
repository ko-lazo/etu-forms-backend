type Awaitable<T> = T | Promise<T>;

export type ResourcePolicy<TEntity, TCreateContext = void> = {
  readonly view: (
    userId: string | undefined,
    entity: TEntity,
  ) => Awaitable<boolean>;

  readonly create: (
    userId: string | undefined,
    context: TCreateContext,
  ) => Awaitable<boolean>;

  readonly update: (
    userId: string | undefined,
    entity: TEntity,
  ) => Awaitable<boolean>;

  readonly delete: (
    userId: string | undefined,
    entity: TEntity,
  ) => Awaitable<boolean>;
};

export interface IResourcePolicy<TEntity> {
  view(userId: string | undefined, entity: TEntity): boolean | Promise<boolean>;

  update(userId: string, entity: TEntity): boolean | Promise<boolean>;

  delete(userId: string, entity: TEntity): boolean | Promise<boolean>;
}

export interface ISubResourcePolicy<TEntity> extends IResourcePolicy<TEntity> {
  create?(
    userId: string | undefined,
    parentId: string,
  ): boolean | Promise<boolean>;

  update(
    userId: string | undefined,
    entity: TEntity,
  ): boolean | Promise<boolean>;
}
