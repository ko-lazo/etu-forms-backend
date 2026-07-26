// src/database/database.seeder.ts
import { pool } from "./pool";
import { seedUsers } from "../../modules/user/user.seeder";
import { seedForms } from "../../modules/form/form.seeder";

export async function seedDatabase(): Promise<void> {
  console.log("Starting seeding a database...");

  try {
    await pool.query("TRUNCATE TABLE users CASCADE;");
    console.log("Database cleared");

    const createdUsers = await seedUsers(10);
    console.log(`Users created: ${createdUsers.length}`);

    const createdForms = await seedForms(createdUsers);
    console.log(`Forms created: ${createdForms.length}`);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedDatabase()
  .then(() => {
    console.log("Seeding a database finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
