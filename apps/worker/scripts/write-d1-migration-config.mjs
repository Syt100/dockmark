#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const [listPath, outputPath] = process.argv.slice(2);

const databaseName = process.env.D1_DATABASE_NAME ?? "dockmark-production";
const binding = process.env.D1_BINDING ?? "DB";
const migrationsDir = process.env.D1_MIGRATIONS_DIR ?? "../../migrations";

if (!listPath || !outputPath) {
  console.error(
    "Usage: node scripts/write-d1-migration-config.mjs <d1-list.json> <output-wrangler.jsonc>",
  );
  process.exit(2);
}

const databases = JSON.parse(await readFile(listPath, "utf8"));

if (!Array.isArray(databases)) {
  console.error("Expected wrangler d1 list --json to return an array.");
  process.exit(2);
}

const database = databases.find((candidate) => candidate?.name === databaseName);
const databaseId = database?.uuid ?? database?.id;

if (!databaseId) {
  const availableNames = databases
    .map((candidate) => candidate?.name)
    .filter(Boolean)
    .sort()
    .join(", ");

  console.error(
    `Could not resolve D1 database '${databaseName}'. Available databases: ${availableNames || "(none)"}`,
  );
  process.exit(1);
}

const migrationConfig = {
  $schema: "node_modules/wrangler/config-schema.json",
  name: "dockmark",
  main: "src/index.ts",
  compatibility_date: "2026-05-28",
  d1_databases: [
    {
      binding,
      database_name: databaseName,
      database_id: databaseId,
      migrations_dir: migrationsDir,
    },
  ],
};

await writeFile(outputPath, `${JSON.stringify(migrationConfig, null, 2)}\n`);
console.log(`Wrote D1 migration config for '${databaseName}'.`);
