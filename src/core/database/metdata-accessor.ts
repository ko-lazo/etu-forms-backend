export abstract class MetadataAccessor<TEntity extends object> {
  protected abstract readonly metadata: {
    tableName: string;
    columns: Record<string, string | undefined>;
  };

  protected col(property: keyof TEntity): string {
    const column = this.metadata.columns[property as string];

    if (!column) {
      throw new Error(`Unknown column "${String(property)}"`);
    }

    return `${this.metadata.tableName}.${column}`;
  }
}
