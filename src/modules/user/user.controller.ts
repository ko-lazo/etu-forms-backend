import { BaseController } from '@/core/controllers/base.controller.js';
import { CreateUserInput, UpdateUserInput, User } from './user.types.js';
import { UserService } from './user.service.js';

export class UserController extends BaseController<
  User,
  CreateUserInput,
  UpdateUserInput
> {
  constructor(userService: UserService) {
    super(userService);
  }
}
