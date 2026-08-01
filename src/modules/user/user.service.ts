import { User } from "./user.types.js";
import { UserRepository } from "./user.repository.js";
import { PasswordHasher } from "@/shared/security/password-hasher.js";
import { BaseService } from "@/core/services/base.service.js";
import { CreateUserDto, UpdateUserDto } from "@/modules/user/user.dto.js";

export class UserService extends BaseService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(
    protected override readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    super(repository);
  }

  override async create(data: CreateUserDto): Promise<User> {
    const passwordHash = await this.passwordHasher.hash(data.password);

    return this.repository.create({
      ...data,
      password: passwordHash,
    });
  }

  // todo change password
}
