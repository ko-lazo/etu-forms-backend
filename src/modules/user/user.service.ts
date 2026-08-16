import {
  type User,
  type UserRegistration,
  type UserUpdate,
} from "./user.types.js";
import { type UserRepository } from "./db/user.repository.js";
import { type PasswordHasher } from "@/shared/security/password-hasher.js";
import { BaseService } from "@/core/services/base.service.js";

export class UserService extends BaseService<
  User,
  UserRegistration,
  UserUpdate
> {
  constructor(
    protected override readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    super(repository);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  override async create(data: UserRegistration): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(data.password);

    return await this.repository.create({
      email: data.email,
      password: passwordHash,
    });
  }

  // todo change password
}
