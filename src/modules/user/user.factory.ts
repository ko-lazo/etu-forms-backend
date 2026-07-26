import type { CreateUserInput } from "./user.types.js";
import { faker } from "@faker-js/faker";

export function makeUser(
  overrides: Partial<CreateUserInput> = {},
): CreateUserInput {
  return {
    email: faker.internet.email().toLowerCase(),
    password: "password",
    ...overrides,
  };
}

export function makeUsers(
  count: number,
  overrides: Partial<CreateUserInput> = {},
): CreateUserInput[] {
  return Array.from({ length: count }, (_, index) => makeUser(overrides));
}
