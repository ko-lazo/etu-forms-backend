import { faker } from "@faker-js/faker";
import { CreateUserDto } from "@/modules/user/user.dto.js";

export function makeUser(
  overrides: Partial<CreateUserDto> = {},
): CreateUserDto {
  return {
    email: faker.internet.email().toLowerCase(),
    password: "password",
    ...overrides,
  };
}

export function makeUsers(
  count: number,
  overrides: Partial<CreateUserDto> = {},
): CreateUserDto[] {
  return Array.from({ length: count }, (_, index) => makeUser(overrides));
}
