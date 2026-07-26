export interface User {
  readonly id: string;
  readonly email: string;
  readonly password: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateUserInput {
  readonly email: string;
  readonly password: string;
}

export interface UpdateUserInput {
  // readonly email?: string;
  // readonly password?: Record<string, unknown>;
}
