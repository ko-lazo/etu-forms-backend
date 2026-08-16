import { BaseController } from "@/core/controllers/base.controller.js";
import { User, UserRegistration, UserUpdate } from "../user.types.js";
import { UserService } from "../user.service.js";
import { UserResponseDto } from "./user.dto.js";
import { userMapper } from "./user.mapper.js";

export class UserController extends BaseController<
  User,
  UserRegistration,
  UserUpdate,
  UserResponseDto
> {
  constructor(userService: UserService) {
    super(userService, undefined, userMapper);
  }
}
