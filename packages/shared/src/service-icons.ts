import type { IconType, ValidationResult } from './navigation'

export const automaticIconLimits = {
  maxHtmlBytes: 512 * 1024,
  maxManifestBytes: 512 * 1024,
  maxIconBytes: 1024 * 1024,
  maxCandidates: 8,
  maxRedirects: 3,
  timeoutMs: 5000,
  maxSourceUrlLength: 2048,
} as const

export const managedIconMimeTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/x-icon',
  'image/vnd.microsoft.icon',
] as const

export const conventionalIconPaths = [
  '/favicon.ico',
  '/favicon.png',
  '/favicon.svg',
  '/apple-touch-icon.png',
] as const

export type ManagedIconMimeType = (typeof managedIconMimeTypes)[number]
export type IconCandidateSource = 'html-icon' | 'apple-touch-icon' | 'manifest' | 'conventional'

export type IconCandidate = {
  url: string
  source: IconCandidateSource
  mimeType?: string
  size?: number
}

export type IconFetchRequest = {
  url: string
}

export type ManagedIconDiscoveryResult = {
  kind: 'managed'
  iconType: Extract<IconType, 'r2'>
  icon: string
  assetUrl: string
  sourceUrl: string
  mimeType: ManagedIconMimeType
  byteLength: number
  width?: number
  height?: number
}

export type ExternalIconDiscoveryResult = {
  kind: 'external'
  iconType: Extract<IconType, 'url'>
  icon: string
  sourceUrl: string
  mimeType?: string
  width?: number
  height?: number
}

export type IconDiscoveryResult = ManagedIconDiscoveryResult | ExternalIconDiscoveryResult

export type ManagedIconUploadMetadata = {
  sourceUrl: string
}

const managedIconExtensions: Record<ManagedIconMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
}

const sourcePriority: Record<IconCandidateSource, number> = {
  'html-icon': 4,
  'apple-touch-icon': 3,
  manifest: 2,
  conventional: 1,
}

export function isManagedIconMimeType(value: string): value is ManagedIconMimeType {
  return managedIconMimeTypes.includes(value.toLowerCase() as ManagedIconMimeType)
}

export function managedIconExtensionForMimeType(mimeType: ManagedIconMimeType): string {
  return managedIconExtensions[mimeType]
}

export function managedIconKey(hash: string, mimeType: ManagedIconMimeType): string {
  return `icons/sha256/${hash}.${managedIconExtensionForMimeType(mimeType)}`
}

export function parseManagedIconKey(value: string): { hash: string; extension: string } | null {
  const match = /^icons\/sha256\/([a-f0-9]{64})\.(png|jpg|webp|gif|ico)$/.exec(value)

  if (!match) {
    return null
  }

  return { hash: match[1] ?? '', extension: match[2] ?? '' }
}

export function rankIconCandidates(candidates: IconCandidate[]): IconCandidate[] {
  const unique = new Map<string, IconCandidate>()

  for (const candidate of candidates) {
    if (!unique.has(candidate.url)) {
      unique.set(candidate.url, candidate)
    }
  }

  return [...unique.values()]
    .sort(
      (left, right) =>
        candidateScore(right) - candidateScore(left) || left.url.localeCompare(right.url),
    )
    .slice(0, automaticIconLimits.maxCandidates)
}

function candidateScore(candidate: IconCandidate): number {
  const normalizedMime = candidate.mimeType?.toLowerCase() ?? ''
  const vectorBonus =
    normalizedMime === 'image/svg+xml' || candidate.url.toLowerCase().endsWith('.svg') ? 500 : 0
  const size = Math.max(0, Math.min(candidate.size ?? 0, 512))
  return sourcePriority[candidate.source] * 10_000 + vectorBonus + size
}

export function validateIconFetchRequest(input: unknown): ValidationResult<IconFetchRequest> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: ['body must be an object'] }
  }

  const url = (input as Record<string, unknown>).url

  if (typeof url !== 'string' || url.trim().length === 0) {
    return { ok: false, errors: ['url is required'] }
  }

  const normalized = url.trim()

  if (normalized.length > automaticIconLimits.maxSourceUrlLength) {
    return {
      ok: false,
      errors: [`url must be at most ${automaticIconLimits.maxSourceUrlLength} characters`],
    }
  }

  try {
    const parsed = new URL(normalized)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, errors: ['url must use http or https'] }
    }
  } catch {
    return { ok: false, errors: ['url must be a valid URL'] }
  }

  return { ok: true, value: { url: normalized } }
}
