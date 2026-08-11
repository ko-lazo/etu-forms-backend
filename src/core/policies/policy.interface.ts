export interface IResourcePolicy<TEntity> {
  view(userId: string | undefined, entity: TEntity): boolean | Promise<boolean>;

  update(userId: string, entity: TEntity): boolean | Promise<boolean>;

  delete(userId: string, entity: TEntity): boolean | Promise<boolean>;
}
