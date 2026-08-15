import { faker } from "@faker-js/faker";

export type CountStrict = number;
export type CountRandom = { min: number; max: number };

export interface SeedScenario {
  readonly users: CountStrict;
  readonly formsPerUser: CountRandom;
  readonly responsesPerForm: CountRandom;
}

/** Сколько сущностей уходит в БД за одну итерацию. */
export const SEED_CHUNK_SIZE = 500;

export function resolveCount(count: CountStrict | CountRandom): number {
  return typeof count === "number" ? count : faker.number.int(count);
}

/**
 * Нарезает поток сущностей на пачки
 */
export function* chunked<T>(
  items: Iterable<T>,
  size: number = SEED_CHUNK_SIZE,
): Generator<T[]> {
  let chunk: T[] = [];

  for (const item of items) {
    chunk.push(item);

    if (chunk.length === size) {
      yield chunk;
      chunk = [];
    }
  }

  if (chunk.length > 0) {
    yield chunk;
  }
}
