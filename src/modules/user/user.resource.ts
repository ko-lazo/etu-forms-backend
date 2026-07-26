import type { User } from "./user.types.js";

export interface UserResourceData {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class UserResource {
  public static make(user: User): UserResourceData {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  public static collection(users: readonly User[]): UserResourceData[] {
    return users.map(UserResource.make);
  }
}
