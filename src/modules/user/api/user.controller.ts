import { BaseController } from "@/core/controllers/base.controller.js";
import {
  type User,
  type UserRegistration,
  type UserUpdate,
} from "../user.types.js";
import { type UserService } from "../user.service.js";
import { type UserResponseDto } from "./user.dto.js";
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
