import { type User } from "../user.types.js";
import { userDto, type UserResponseDto } from "./user.dto.js";
import { type IMapper } from "@/core/dto/mapper.interface.js";

export const userMapper: IMapper<User, UserResponseDto> = {
  toResponse(user: User): UserResponseDto {
    const raw = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };

    return userDto.responseSchema.parse(raw);
  },

  toResponseCollection(users: User[]): UserResponseDto[] {
    return users.map((user) => this.toResponse(user));
  },
};
