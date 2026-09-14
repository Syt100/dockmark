import {
  dockmarkExportSchemaVersion,
  estimateJsonByteLength,
  validateDockmarkExportDocument,
  type DockmarkExportDocument,
} from './import-export'
import {
  automaticIconLimits,
  isManagedIconMimeType,
  managedIconExtensionForMimeType,
  parseManagedIconKey,
  type ManagedIconMimeType,
} from './service-icons'
import type { ValidationResult } from './navigation'

export const dockmarkAssetExportSchemaVersion = 2 as const
export const managedExportLimits = {
  maxAssets: 2000,
  maxTotalAssetBytes: 20 * 1024 * 1024,
  maxJsonBytes: 30 * 1024 * 1024,
} as const

export type ManagedExportIconAsset = {
  key: string
  hash: string
  mimeType: ManagedIconMimeType
  byteLength: number
  dataBase64: string
}

export type DockmarkExportDocumentV2 = Omit<DockmarkExportDocument, 'schemaVersion'> & {
  schemaVersion: typeof dockmarkAssetExportSchemaVersion
  assets: ManagedExportIconAsset[]
}

export type DockmarkPortableExportDocument = DockmarkExportDocument | DockmarkExportDocumentV2

export type PortableExportValidation = {
  schemaVersion: typeof dockmarkExportSchemaVersion | typeof dockmarkAssetExportSchemaVersion
  document: DockmarkExportDocument
  assets: ManagedExportIconAsset[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStrictBase64(value: string): boolean {
  if (value.length === 0 || value.length % 4 !== 0) return false
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
}

export function base64ByteLength(value: string): number {
  if (!isStrictBase64(value)) return -1
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0
  return (value.length / 4) * 3 - padding
}

function parseAsset(
  value: unknown,
  index: number,
  errors: string[],
): ManagedExportIconAsset | null {
  const path = `assets.${index}`
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return null
  }

  const key = typeof value.key === 'string' ? value.key.trim() : ''
  const hash = typeof value.hash === 'string' ? value.hash.trim().toLowerCase() : ''
  const mimeType = typeof value.mimeType === 'string' ? value.mimeType.trim().toLowerCase() : ''
  const byteLength = value.byteLength
  const dataBase64 = typeof value.dataBase64 === 'string' ? value.dataBase64 : ''

  const parsedKey = parseManagedIconKey(key)
  if (!parsedKey) errors.push(`${path}.key must be a managed icon key`)
  if (!/^[a-f0-9]{64}$/.test(hash)) errors.push(`${path}.hash must be a SHA-256 hex digest`)
  if (parsedKey && parsedKey.hash !== hash) errors.push(`${path}.hash must match the key hash`)

  if (!isManagedIconMimeType(mimeType)) {
    errors.push(`${path}.mimeType must be a supported managed icon media type`)
  } else if (parsedKey && parsedKey.extension !== managedIconExtensionForMimeType(mimeType)) {
    errors.push(`${path}.mimeType must match the managed icon key extension`)
  }

  if (!Number.isInteger(byteLength) || (byteLength as number) <= 0) {
    errors.push(`${path}.byteLength must be a positive integer`)
  } else if ((byteLength as number) > automaticIconLimits.maxIconBytes) {
    errors.push(`${path}.byteLength must be at most ${automaticIconLimits.maxIconBytes}`)
  }

  const decodedLength = base64ByteLength(dataBase64)
  if (decodedLength < 0) {
    errors.push(`${path}.dataBase64 must be canonical base64`)
  } else if (decodedLength !== byteLength) {
    errors.push(`${path}.dataBase64 byte length must match byteLength`)
  }

  if (!parsedKey || !/^[a-f0-9]{64}$/.test(hash) || !isManagedIconMimeType(mimeType)) {
    return null
  }

  return {
    key,
    hash,
    mimeType,
    byteLength: typeof byteLength === 'number' ? byteLength : 0,
    dataBase64,
  }
}

export function validatePortableDockmarkExportDocument(
  input: unknown,
): ValidationResult<PortableExportValidation> {
  if (!isRecord(input)) {
    return { ok: false, errors: ['document must be an object'] }
  }

  if (input.schemaVersion === dockmarkExportSchemaVersion) {
    const validated = validateDockmarkExportDocument(input)
    return validated.ok
      ? {
          ok: true,
          value: {
            schemaVersion: dockmarkExportSchemaVersion,
            document: validated.value,
            assets: [],
          },
        }
      : validated
  }

  if (input.schemaVersion !== dockmarkAssetExportSchemaVersion) {
    return {
      ok: false,
      errors: [
        `schemaVersion must be ${dockmarkExportSchemaVersion} or ${dockmarkAssetExportSchemaVersion}`,
      ],
    }
  }

  const { assets: rawAssets, ...recordFields } = input
  const records = validateDockmarkExportDocument({
    ...recordFields,
    schemaVersion: dockmarkExportSchemaVersion,
  })
  const errors: string[] = records.ok ? [] : [...records.errors]

  if (!Array.isArray(rawAssets)) {
    errors.push('assets must be an array')
  }

  const assets = Array.isArray(rawAssets)
    ? rawAssets
        .map((asset, index) => parseAsset(asset, index, errors))
        .filter((asset): asset is ManagedExportIconAsset => asset !== null)
    : []

  if (assets.length > managedExportLimits.maxAssets) {
    errors.push(`assets must be at most ${managedExportLimits.maxAssets}`)
  }

  const totalAssetBytes = assets.reduce((total, asset) => total + asset.byteLength, 0)
  if (totalAssetBytes > managedExportLimits.maxTotalAssetBytes) {
    errors.push(
      `managed icon assets must total at most ${managedExportLimits.maxTotalAssetBytes} bytes`,
    )
  }

  if (estimateJsonByteLength(input) > managedExportLimits.maxJsonBytes) {
    errors.push(`schema v2 document size must be at most ${managedExportLimits.maxJsonBytes} bytes`)
  }

  const seenKeys = new Set<string>()
  for (const asset of assets) {
    if (seenKeys.has(asset.key)) {
      errors.push(`asset keys must be unique: ${asset.key}`)
    }
    seenKeys.add(asset.key)
  }

  if (records.ok) {
    for (const item of records.value.items) {
      if (item.iconType === 'r2' && (!item.icon || !seenKeys.has(item.icon))) {
        errors.push(`managed icon asset is missing for service: ${item.name}`)
      }
    }
  }

  if (errors.length > 0 || !records.ok) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      schemaVersion: dockmarkAssetExportSchemaVersion,
      document: records.value,
      assets,
    },
  }
}
