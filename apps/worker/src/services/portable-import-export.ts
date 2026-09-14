import {
  automaticIconLimits,
  dockmarkAssetExportSchemaVersion,
  issuesFromMessages,
  managedIconExtensionForMimeType,
  parseManagedIconKey,
  validatePortableDockmarkExportDocument,
  type DockmarkImportMode,
  type DockmarkPortableExportDocument,
  type ImportPreviewResponse,
  type ImportSummary,
  type ManagedExportIconAsset,
} from '@dockmark/shared'

import {
  buildExportDocument,
  getCurrentImportSummary,
  importDocument,
  previewImport,
} from './import-export'
import { detectManagedIconMimeType } from './service-icons'

type PortableStore = {
  DB: D1Database
  ICONS?: R2Bucket
}

type VerifiedAsset = {
  asset: ManagedExportIconAsset
  bytes: Uint8Array<ArrayBuffer>
}

const emptySummary: ImportSummary = { categories: 0, tags: 0, items: 0, endpoints: 0 }

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  return bytesToHex(await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes)))
}

function requireBucket(bucket: R2Bucket | undefined): R2Bucket {
  if (!bucket) {
    throw new Error('Managed icon storage is not configured')
  }

  return bucket
}

async function exportManagedAsset(bucket: R2Bucket, key: string): Promise<ManagedExportIconAsset> {
  const parsedKey = parseManagedIconKey(key)
  if (!parsedKey) {
    throw new Error(`Managed icon key is invalid: ${key}`)
  }

  const object = await bucket.get(key)
  if (!object) {
    throw new Error(`Managed icon asset is missing: ${key}`)
  }

  if (object.size <= 0 || object.size > automaticIconLimits.maxIconBytes) {
    throw new Error(`Managed icon asset has an invalid size: ${key}`)
  }

  const bytes = new Uint8Array(await object.arrayBuffer())
  const mimeType = detectManagedIconMimeType(bytes)
  if (!mimeType) {
    throw new Error(`Managed icon asset has an unsupported media type: ${key}`)
  }

  if (managedIconExtensionForMimeType(mimeType) !== parsedKey.extension) {
    throw new Error(`Managed icon media type does not match its key: ${key}`)
  }

  const hash = await sha256Hex(bytes)
  if (hash !== parsedKey.hash) {
    throw new Error(`Managed icon asset hash does not match its key: ${key}`)
  }

  return {
    key,
    hash,
    mimeType,
    byteLength: bytes.byteLength,
    dataBase64: bytesToBase64(bytes),
  }
}

function requirePortableExportLimits(
  document: DockmarkPortableExportDocument,
): DockmarkPortableExportDocument {
  const validation = validatePortableDockmarkExportDocument(document)
  if (!validation.ok) {
    throw new Error(`Export document is not portable: ${validation.errors.join('; ')}`)
  }

  return document
}

export async function buildPortableExportDocument(
  store: PortableStore,
  appVersion = '0.1.0',
): Promise<DockmarkPortableExportDocument> {
  const records = await buildExportDocument(store.DB, appVersion)
  const managedKeys = [
    ...new Set(
      records.items
        .filter((item) => item.iconType === 'r2' && item.icon)
        .map((item) => item.icon as string),
    ),
  ]

  if (managedKeys.length === 0) {
    return records
  }

  const bucket = requireBucket(store.ICONS)
  const assets = await Promise.all(managedKeys.map((key) => exportManagedAsset(bucket, key)))

  return requirePortableExportLimits({
    ...records,
    schemaVersion: dockmarkAssetExportSchemaVersion,
    assets,
  })
}

function v1ManagedIconErrors(
  schemaVersion: number,
  document: { items: Array<{ name: string; iconType: string }> },
): string[] {
  if (schemaVersion !== 1) return []

  return document.items
    .filter((item) => item.iconType === 'r2')
    .map((item) => `schema v1 cannot restore managed icon assets for service: ${item.name}`)
}

export async function previewPortableImport(
  db: D1Database,
  mode: DockmarkImportMode,
  input: unknown,
): Promise<ImportPreviewResponse> {
  const validation = validatePortableDockmarkExportDocument(input)

  if (!validation.ok) {
    return {
      ok: false,
      mode,
      summary: emptySummary,
      ...(mode === 'replaceAll' ? { currentSummary: await getCurrentImportSummary(db) } : {}),
      issues: issuesFromMessages(validation.errors, 'validation'),
      errors: validation.errors,
    }
  }

  const portabilityErrors = v1ManagedIconErrors(
    validation.value.schemaVersion,
    validation.value.document,
  )
  if (portabilityErrors.length > 0) {
    return {
      ok: false,
      mode,
      summary: emptySummary,
      ...(mode === 'replaceAll' ? { currentSummary: await getCurrentImportSummary(db) } : {}),
      issues: issuesFromMessages(portabilityErrors, 'validation'),
      errors: portabilityErrors,
    }
  }

  const { document: _document, ...preview } = await previewImport(
    db,
    mode,
    validation.value.document,
  )
  return preview
}

async function verifyAsset(asset: ManagedExportIconAsset): Promise<VerifiedAsset> {
  const bytes = base64ToBytes(asset.dataBase64)

  if (bytes.byteLength !== asset.byteLength) {
    throw new Error(`Managed icon asset byte length does not match: ${asset.key}`)
  }

  const mimeType = detectManagedIconMimeType(bytes)
  if (mimeType !== asset.mimeType) {
    throw new Error(`Managed icon asset media type does not match its bytes: ${asset.key}`)
  }

  const hash = await sha256Hex(bytes)
  if (hash !== asset.hash) {
    throw new Error(`Managed icon asset SHA-256 does not match: ${asset.key}`)
  }

  const parsedKey = parseManagedIconKey(asset.key)
  if (!parsedKey || parsedKey.hash !== hash) {
    throw new Error(`Managed icon asset key does not match its bytes: ${asset.key}`)
  }

  if (managedIconExtensionForMimeType(asset.mimeType) !== parsedKey.extension) {
    throw new Error(`Managed icon asset key extension does not match its media type: ${asset.key}`)
  }

  return { asset, bytes }
}

async function restoreManagedAssets(
  bucket: R2Bucket | undefined,
  assets: ManagedExportIconAsset[],
) {
  if (assets.length === 0) return

  const target = requireBucket(bucket)
  const verified = await Promise.all(assets.map(verifyAsset))

  for (const { asset, bytes } of verified) {
    if (await target.head(asset.key)) continue

    await target.put(asset.key, bytes, {
      httpMetadata: { contentType: asset.mimeType },
      customMetadata: { source: 'dockmark-import' },
    })
  }
}

export async function importPortableDocument(
  store: PortableStore,
  mode: DockmarkImportMode,
  input: unknown,
) {
  const validation = validatePortableDockmarkExportDocument(input)
  if (!validation.ok) {
    throw new Error(validation.errors.join('; ') || 'Import document is invalid')
  }

  const portabilityErrors = v1ManagedIconErrors(
    validation.value.schemaVersion,
    validation.value.document,
  )
  if (portabilityErrors.length > 0) {
    throw new Error(portabilityErrors.join('; '))
  }

  const preview = await previewImport(store.DB, mode, validation.value.document)
  if (!preview.ok) {
    throw new Error(preview.errors.join('; ') || 'Import document is invalid')
  }

  await restoreManagedAssets(store.ICONS, validation.value.assets)
  return importDocument(store, mode, validation.value.document)
}
