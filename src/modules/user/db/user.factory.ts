import { faker } from "@faker-js/faker";
import type { UserCreate } from "../user.types.js";

export function makeUser(
  overrides: Partial<UserCreate> = {},
): UserCreate {
  return {
    email: faker.internet.email().toLowerCase(),
    password: "password",
    ...overrides,
  };
}

export function makeUsers(
  count: number,
  overrides: Partial<UserCreate> = {},
): UserCreate[] {
  return Array.from({ length: count }, (_, index) =>
    makeUser({
      email: `${faker.internet.email().toLowerCase()}`,
      ...overrides,
    }),
  );
}
