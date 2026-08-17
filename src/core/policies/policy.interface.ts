type Awaitable<T> = T | Promise<T>;

export type IReadPolicy<TEntity> = {
  readonly view: (
    userId: string | undefined,
    entity: TEntity,
  ) => Awaitable<boolean>;
};

export type IResourcePolicy<
  TEntity,
  TCreateContext = void,
> = IReadPolicy<TEntity> & {
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
