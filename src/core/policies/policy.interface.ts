type Awaitable<T> = T | Promise<T>;

export type IResourcePolicy<TEntity, TCreateContext = void> = {
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
