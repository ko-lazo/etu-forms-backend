export interface IResourcePolicy<TEntity> {
  viewAny?(userId: string): boolean | Promise<boolean>;

  view?(userId: string, entity: TEntity): boolean | Promise<boolean>;

  create?(userId: string): boolean | Promise<boolean>;

  update?(userId: string, entity: TEntity): boolean | Promise<boolean>;

  delete?(userId: string, entity: TEntity): boolean | Promise<boolean>;
}
