import { pool } from "@/core/database/pool.js";
import { seedDatabase } from "./seed/seed.runner.js";
import { scenario } from "./seed/seed.scenario.js";

console.log("Starting seeding a database...");

try {
  await seedDatabase(scenario);
  console.log("Seeding a database finished");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
