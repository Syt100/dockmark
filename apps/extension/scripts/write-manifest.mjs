import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(scriptDir, '..')
const distDir = resolve(appDir, 'dist')
const manifestModule = await import(pathToFileURL(resolve(distDir, 'manifest.js')).href)

await mkdir(distDir, { recursive: true })
await writeFile(
  resolve(distDir, 'manifest.json'),
  `${JSON.stringify(manifestModule.manifest, null, 2)}\n`,
)
