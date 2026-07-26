import { exec } from "child_process";
import fs from "fs";
import path from "path";

const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Error: specify migration name");
  process.exit(1);
}

exec(`npx dbmate new ${migrationName}`, (error, stdout, stderr) => {
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const output = stdout.trim() || stderr.trim();
  console.log(output);

  const absolutePath = getPath(output);

  if (migrationName.startsWith("create_")) {
    const tableName = migrationName
      .replace(/^create_/, "")
      .replace(/_table$/, "");

    writeUpdateTriggerToMigration(tableName, absolutePath);

    console.log(`Added update trigger for table "${tableName}"...`);
  }
});

function getPath(output: string): string {
  const filePathMatch = output.match(/db\/migrations\/\d+_.+\.sql/);
  if (!filePathMatch) {
    console.warn("Migration file not found");
    process.exit(0);
  }

  return path.resolve(filePathMatch[0]);
}

function writeUpdateTriggerToMigration(
  tableName: string,
  absolutePath: string,
) {
  const triggerTemplate = `
-- migrate:up



CREATE TRIGGER ${tableName}_set_updated_at
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- migrate:down

DROP TABLE IF EXISTS ${tableName};

DROP TRIGGER IF EXISTS ${tableName}_set_updated_at ON ${tableName};
`;

  fs.writeFileSync(absolutePath, triggerTemplate.trim() + "\n", "utf8");
}
