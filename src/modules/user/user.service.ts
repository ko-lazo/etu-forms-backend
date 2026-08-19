import { type User, type UserRegistration } from "./user.types.js";
import { type UserRepository } from "./db/user.repository.js";
import { type PasswordHasher } from "@/shared/security/password-hasher.js";

export function createUserService(
  repository: UserRepository,
  passwordHasher: PasswordHasher,
) {
  const findById = (id: string): Promise<User | null> =>
    repository.findById(id);

  const findByEmail = (email: string): Promise<User | null> =>
    repository.findByEmail(email);

  async function create(data: UserRegistration): Promise<User> {
    const password = await passwordHasher.hash(data.password);
    return await repository.create({ email: data.email, password });
  }

  // todo change password

  return { findById, findByEmail, create };
}

export type UserService = ReturnType<typeof createUserService>;
