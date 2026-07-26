import { makeUsers } from "./user.factory.js";
import { User } from "./user.types.js";
import { createUserModule } from "./user.module";

export async function seedUsers(count = 10): Promise<User[]> {
  const userModule = createUserModule();

  const rawUsersInput = makeUsers(count);

  return await userModule.service.createMany(rawUsersInput);
}
