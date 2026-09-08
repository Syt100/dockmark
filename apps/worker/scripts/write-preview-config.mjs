#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const [d1ListPath, kvListPath, outputPath] = process.argv.slice(2)

const d1DatabaseName = process.env.PREVIEW_D1_DATABASE_NAME ?? 'dockmark-preview'
const kvNamespaceName = process.env.PREVIEW_KV_NAMESPACE_NAME ?? 'dockmark-preview'

if (!d1ListPath || !kvListPath || !outputPath) {
  console.error(
    'Usage: node scripts/write-preview-config.mjs <d1-list.json> <kv-list.json> <output-wrangler.jsonc>',
  )
  process.exit(2)
}

const d1Databases = JSON.parse(await readFile(d1ListPath, 'utf8'))
const kvNamespaces = JSON.parse(await readFile(kvListPath, 'utf8'))

if (!Array.isArray(d1Databases)) {
  console.error('Expected wrangler d1 list --json to return an array.')
  process.exit(2)
}

if (!Array.isArray(kvNamespaces)) {
  console.error('Expected wrangler kv namespace list to return an array.')
  process.exit(2)
}

const database = d1Databases.find((candidate) => candidate?.name === d1DatabaseName)
const databaseId = database?.uuid ?? database?.id
const namespace = kvNamespaces.find(
  (candidate) => candidate?.title === kvNamespaceName || candidate?.name === kvNamespaceName,
)
const namespaceId = namespace?.id

if (!databaseId) {
  console.error(`Could not resolve preview D1 database '${d1DatabaseName}'.`)
  process.exit(1)
}

if (!namespaceId) {
  console.error(`Could not resolve preview KV namespace '${kvNamespaceName}'.`)
  process.exit(1)
}

const config = {
  name: 'dockmark-preview',
  main: 'src/index.ts',
  compatibility_date: '2026-05-28',
  workers_dev: true,
  preview_urls: true,
  assets: {
    directory: '../web/dist',
    binding: 'ASSETS',
    not_found_handling: 'single-page-application',
  },
  vars: {
    AUTH_MODE: 'development',
    APP_VERSION: process.env.PREVIEW_APP_VERSION ?? 'preview',
  },
  d1_databases: [
    {
      binding: 'DB',
      database_name: d1DatabaseName,
      database_id: databaseId,
      migrations_dir: '../../migrations',
    },
  ],
  kv_namespaces: [
    {
      binding: 'KV',
      id: namespaceId,
    },
  ],
  observability: {
    enabled: true,
    head_sampling_rate: 1,
  },
}

await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`)
console.log(`Wrote preview Worker config for D1 '${d1DatabaseName}' and KV '${kvNamespaceName}'.`)
