#!/usr/bin/env node

import { readFile } from 'node:fs/promises'

const [listPath, databaseName] = process.argv.slice(2)

if (!listPath || !databaseName) {
  console.error('Usage: node scripts/d1-exists.mjs <d1-list.json> <database-name>')
  process.exit(2)
}

const databases = JSON.parse(await readFile(listPath, 'utf8'))

if (!Array.isArray(databases)) {
  console.error('Expected wrangler d1 list --json to return an array.')
  process.exit(2)
}

const exists = databases.some((candidate) => candidate?.name === databaseName)

process.exit(exists ? 0 : 1)
