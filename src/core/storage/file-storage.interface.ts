import type { Readable, Writable } from "node:stream";

export type StoredFile = {
  readonly key: string;
  readonly size: number;
};

/**
 * Контракт хранилища файлов.
 *
 * Все методы оперируют уникальными ключами (key), которые представляют собой
 * относительные пути внутри хранилища
 *
 * @example
 * key: `exports/<userId>/<jobId>.xlsx`
 */
export interface IFileStorage {
  createWriteStream(key: string): Promise<Writable>;
  createReadStream(key: string): Readable;

  move(sourceKey: string, targetKey: string): Promise<void>;

  stat(key: string): Promise<StoredFile | null>;
  delete(key: string): Promise<void>;
}
