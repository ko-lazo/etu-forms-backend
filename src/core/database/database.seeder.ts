import { pool } from "./pool.js";
import { seedUsers } from "@/modules/user/user.seeder.js";
import { seedForms } from "@/modules/form/form.seeder.js";
import { seedFormResponses } from "@/modules/form-response/form-response.seeder.js";

export async function seedDatabase(): Promise<void> {
  console.log("Starting seeding a database...");

  try {
    await clearDatabase();

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

async function clearDatabase(): Promise<void> {
  const res = await pool.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name != 'schema_migrations';
`);

  const tables = res.rows.map((row) => `"${row.table_name}"`);

  if (tables.length > 0) {
    const truncateQuery = `TRUNCATE TABLE ${tables.join(", ")} CASCADE;`;
    await pool.query(truncateQuery);
    console.log("Database cleared");
  } else {
    console.log("No tables found to clear.");
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
