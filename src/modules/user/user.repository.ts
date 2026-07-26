import { BaseRepository } from '@/core/repositories/base.repository.js';
import { userMetadata } from './user.metadata.js';
import type { CreateUserInput, User, UpdateUserInput } from './user.types.js';
import { DatabaseClient } from '@/core/database/database.client.js';

export class UserRepository extends BaseRepository<
  User,
  CreateUserInput,
  UpdateUserInput
> {
  constructor(db: DatabaseClient) {
    super(db, userMetadata);
  }
}
