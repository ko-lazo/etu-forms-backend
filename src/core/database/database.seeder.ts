import { pool } from "./pool.js";
import { seedUsers } from "@/modules/user/user.seeder.js";
import { seedForms } from "@/modules/form/form.seeder.js";
import { seedFormResponses } from "@/modules/form-response/form-response.seeder.js";

export async function seedDatabase(): Promise<void> {
  console.log("Starting seeding a database...");

  try {
    // await pool.query("TRUNCATE TABLE users CASCADE;");
    // console.log("Database cleared");

    const createdUsers = await seedUsers(10);
    console.log(`Users created: ${createdUsers.length}`);

    const createdForms = await seedForms(createdUsers);
    console.log(`Forms created: ${createdForms.length}`);

    const createdFormResponses = await seedFormResponses(createdForms);
    console.log(`Form responses created: ${createdFormResponses.length}`);
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
