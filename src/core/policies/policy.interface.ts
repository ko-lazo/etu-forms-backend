type Awaitable<T> = T | Promise<T>;

type PolicyRule<TSubject> = (
  userId: string | undefined,
  subject: TSubject,
) => Awaitable<boolean>;

export type IReadPolicy<TEntity> = {
  readonly view: PolicyRule<TEntity>;
};

export type IResourcePolicy<
  TEntity,
  TCreateContext = void,
> = IReadPolicy<TEntity> & {
  readonly create: PolicyRule<TCreateContext>;
  readonly update: PolicyRule<TEntity>;
  readonly delete: PolicyRule<TEntity>;
};
