import { once } from "node:events";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import type { Readable, Writable } from "node:stream";

import type { IFileStorage, StoredFile } from "./file-storage.interface.js";

export class LocalFileStorage implements IFileStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  public async createWriteStream(key: string): Promise<Writable> {
    const filePath = this.resolveKey(key);

    await fsp.mkdir(path.dirname(filePath), { recursive: true });

    const stream = fs.createWriteStream(filePath);

    await once(stream, "open");

    return stream;
  }

  public createReadStream(key: string): Readable {
    return fs.createReadStream(this.resolveKey(key));
  }

  public async move(sourceKey: string, targetKey: string): Promise<void> {
    const targetPath = this.resolveKey(targetKey);

    await fsp.mkdir(path.dirname(targetPath), { recursive: true });
    await fsp.rename(this.resolveKey(sourceKey), targetPath);
  }

  public async stat(key: string): Promise<StoredFile | null> {
    try {
      const stats = await fsp.stat(this.resolveKey(key));
      return { key, size: stats.size };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  }

  public async delete(key: string): Promise<void> {
    await fsp.rm(this.resolveKey(key), { force: true });
  }

  /**
   * Проверка, что путь не вышел за пределы корня хранилища
   */
  private resolveKey(key: string): string {
    if (key.length === 0 || key.includes("\0")) {
      throw new Error("Invalid storage key");
    }

    const filePath = path.resolve(this.root, key);

    if (filePath !== this.root && !filePath.startsWith(this.root + path.sep)) {
      throw new Error(
        `Directory traversal detected: key "${key}" leads outside the storage root`,
      );
    }

    return filePath;
  }
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
