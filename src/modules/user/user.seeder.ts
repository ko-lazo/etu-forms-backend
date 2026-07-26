import { makeUsers } from "./user.factory.js";
import { User } from "./user.types.js";
import { createUserModule } from "./user.module";

export async function seedUsers(count = 100): Promise<User[]> {
  const userModule = createUserModule();
  const rawUsersInput = makeUsers(count);

  const createdUsers: User[] = [];
  const chunkSize = 50;

  for (let i = 0; i < rawUsersInput.length; i += chunkSize) {
    const chunk = rawUsersInput.slice(i, i + chunkSize);

    const savedChunk = await Promise.all(
      chunk.map((user) => userModule.service.create(user)),
    );

    createdUsers.push(...savedChunk);
  }

  return createdUsers;
}
