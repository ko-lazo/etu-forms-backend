import { CreateUserInput, UpdateUserInput, User } from "./user.types";
import { UserRepository } from "./user.repository";
import { PasswordHasher } from "../../shared/security/password-hasher";
import { BaseService } from "../../core/services/base.service";

export class UserService extends BaseService<
  User,
  CreateUserInput,
  UpdateUserInput
> {
  constructor(
    repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    super(repository);
  }

  override async create(data: CreateUserInput): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(data.password);

    return this.repository.create({
      ...data,
      password: passwordHash,
    });
  }

  // todo change password
}
