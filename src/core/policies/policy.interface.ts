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
}
