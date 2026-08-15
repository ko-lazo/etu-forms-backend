import { makeUsers } from "./user.factory.js";
import { User } from "./user.types.js";
import { createUserModule } from "./user.module.js";
import { chunked, CountStrict, resolveCount } from "@/core/database/seed.js";

export async function seedUsers(count: CountStrict): Promise<User[]> {
  const userModule = createUserModule();
  const rawUsersInput = makeUsers(resolveCount(count));

  const createdUsers: User[] = [];

  for (const chunk of chunked(rawUsersInput)) {
    const savedChunk = await Promise.all(
      chunk.map((user) => userModule.service.create(user)),
    );

    createdUsers.push(...savedChunk);
  }

  return createdUsers;
}
