export interface IResourcePolicy<TEntity> {
  view(userId: string, entity: TEntity): boolean | Promise<boolean>;

  update(userId: string, entity: TEntity): boolean | Promise<boolean>;

  delete(userId: string, entity: TEntity): boolean | Promise<boolean>;
}
