import { dbClient, pool } from "@/core/database/pool.js";
import { createUserModule } from "@/modules/user/user.module.js";
import { createFormModule } from "@/modules/form/form.module.js";
import { FormResponseRepository } from "@/modules/form-response/db/form-response.repository.js";
import { PasswordHasher } from "@/shared/security/password-hasher.js";
import { seedUsers } from "@/modules/user/db/user.seeder.js";
import { seedForms } from "@/modules/form/db/form.seeder.js";
import { seedFormResponses } from "@/modules/form-response/db/form-response.seeder.js";
import { counter, type SeedScenario } from "./seed.scenario.js";
import {appConfig} from "@/config/index.js";

export async function seedDatabase(scenario: SeedScenario): Promise<void> {
  const userRepository = createUserModule().repository;
  const formRepository = createFormModule().repository;
  const formResponseRepository = new FormResponseRepository(dbClient);
  const passwordHasher = new PasswordHasher();

  if (!appConfig.isProduction) {
    await clearDatabase();
  }

  const createdUsers = await seedUsers(
    userRepository,
    passwordHasher,
    scenario.users,
  );
  console.log(`Users created: ${createdUsers.length}`);

  const createdForms = await seedForms(
    formRepository,
    createdUsers,
    counter(scenario.formsPerUser),
  );
  console.log(`Forms created: ${createdForms.length}`);

  const createdFormResponses = await seedFormResponses(
    formResponseRepository,
    createdForms,
    counter(scenario.responsesPerForm),
  );
  console.log(`Form responses created: ${createdFormResponses}`);
}

async function clearDatabase(): Promise<void> {
  const res = await pool.query<{ table_name: string }>(`
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
