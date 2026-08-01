export interface User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type UserCreate = Pick<User, "email" | "password">;
export type UserUpdate = Partial<Pick<User, "email">>;
