import { BaseController } from "@/core/controllers/base.controller.js";
import { User } from "../user.types.js";
import { UserService } from "../user.service.js";
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
} from "./user.dto.js";
import { userMapper } from "./user.mapper.js";

export class UserController extends BaseController<
  User,
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto
> {
  constructor(userService: UserService) {
    super(userService, undefined, userMapper);
  }
}
