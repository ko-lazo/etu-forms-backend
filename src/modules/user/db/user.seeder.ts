import { makeUsers } from "./user.factory.js";
import type { User } from "../user.types.js";
import type { UserRepository } from "./user.repository.js";
import type { PasswordHasher } from "@/shared/security/password-hasher.js";

const SEED_PASSWORD = "password";

export async function seedUsers(
  repository: UserRepository,
  hasher: PasswordHasher,
  count: number,
): Promise<User[]> {
  const password = await hasher.hash(SEED_PASSWORD);

  return repository.createMany(makeUsers(count, { password }));
}
