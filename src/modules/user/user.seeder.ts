import { makeUsers } from "./user.factory.js";
import type { User } from "./user.types.js";
import type { UserService } from "./user.service.js";

export async function seedUsers(
  service: UserService,
  count: number,
): Promise<User[]> {
  const rawUsersInput = makeUsers(count);

  return Promise.all(rawUsersInput.map((user) => service.create(user)));
}
