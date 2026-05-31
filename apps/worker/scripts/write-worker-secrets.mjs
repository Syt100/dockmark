#!/usr/bin/env node

import { writeFile } from "node:fs/promises";

const [outputPath] = process.argv.slice(2);

if (!outputPath) {
  console.error("Usage: node scripts/write-worker-secrets.mjs <output-secrets-json>");
  process.exit(2);
}

const setupToken = process.env.DOCKMARK_SETUP_TOKEN;

if (!setupToken) {
  console.error("DOCKMARK_SETUP_TOKEN is required");
  process.exit(1);
}

await writeFile(outputPath, `${JSON.stringify({ SETUP_TOKEN: setupToken }, null, 2)}\n`, {
  mode: 0o600,
});
