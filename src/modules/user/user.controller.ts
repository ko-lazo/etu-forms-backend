import { BaseController } from "../../core/controllers/base.controller";
import { CreateUserInput, UpdateUserInput, User } from "./user.types";
import { UserService } from "./user.service";

export class UserController extends BaseController<
  User,
  CreateUserInput,
  UpdateUserInput
> {
  constructor(userService: UserService) {
    super(userService);
  }
}
