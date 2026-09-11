import {
  automaticIconLimits,
  conventionalIconPaths,
  isManagedIconMimeType,
  managedIconKey,
  rankIconCandidates,
  type IconCandidate,
  type ManagedIconDiscoveryResult,
  type ManagedIconMimeType,
} from '@dockmark/shared'

export class IconDiscoveryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IconDiscoveryError'
  }
}

const redirectStatuses = new Set([301, 302, 303, 307, 308])

export function assertSafeExternalUrl(value: string): URL {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new IconDiscoveryError('图标来源地址不是有效 URL')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new IconDiscoveryError('服务端图标获取仅支持 HTTP 或 HTTPS')
  }

  if (url.username || url.password) {
    throw new IconDiscoveryError('服务端图标获取不允许 URL 中包含用户名或密码')
  }

  const hostname = normalizeHostname(url.hostname)

  if (isLocalHostname(hostname) || isNonPublicIpLiteral(hostname)) {
    throw new IconDiscoveryError('服务端无法获取本地或私有网络地址，请改用浏览器获取')
  }

  return url
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[/, '').replace(/\]$/, '').replace(/\.$/, '').toLowerCase()
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.lan') ||
    hostname.endsWith('.internal') ||
    hostname === 'home.arpa' ||
    hostname.endsWith('.home.arpa')
  )
}

function isNonPublicIpLiteral(hostname: string): boolean {
  if (hostname.includes(':')) {
    return isNonPublicIpv6(hostname)
  }

  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return false
  }

  const octets = hostname.split('.').map(Number)
  if (octets.some((part) => part < 0 || part > 255)) {
    return true
  }

  const [a = 0, b = 0] = octets

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 0 && octets[2] === 2) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0 && octets[2] === 113) ||
    a >= 224
  )
}

function isNonPublicIpv6(hostname: string): boolean {
  const value = hostname.toLowerCase()

  if (value === '::' || value === '::1') {
    return true
  }

  if (value.startsWith('fc') || value.startsWith('fd') || value.startsWith('ff')) {
    return true
  }

  if (/^fe[89ab]/.test(value)) {
    return true
  }

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value)
  return mapped ? isNonPublicIpLiteral(mapped[1] ?? '') : false
}

export async function fetchSafeExternal(
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  let current = assertSafeExternalUrl(String(input))

  for (let redirects = 0; ; redirects += 1) {
    const response = await fetch(current, {
      ...init,
      redirect: 'manual',
      credentials: 'omit',
      headers: {
        accept: '*/*',
        'user-agent': 'Dockmark/1.0 service-icon-discovery',
        ...init.headers,
      },
      signal: AbortSignal.timeout(automaticIconLimits.timeoutMs),
    })

    if (!redirectStatuses.has(response.status)) {
      return response
    }

    if (redirects >= automaticIconLimits.maxRedirects) {
      throw new IconDiscoveryError('图标来源重定向次数过多')
    }

    const location = response.headers.get('location')
    if (!location) {
      throw new IconDiscoveryError('图标来源返回了无效重定向')
    }

    current = assertSafeExternalUrl(new URL(location, current).toString())
  }
}

export async function readBoundedBytes(response: Response, limit: number): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    throw new IconDiscoveryError(`响应内容超过 ${limit} 字节限制`)
  }

  if (!response.body) {
    return new Uint8Array(await response.arrayBuffer())
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue

      total += value.byteLength
      if (total > limit) {
        await reader.cancel()
        throw new IconDiscoveryError(`响应内容超过 ${limit} 字节限制`)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  const output = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    output.set(chunk, offset)
    offset += chunk.byteLength
  }
  return output
}

async function readBoundedText(response: Response, limit: number): Promise<string> {
  return new TextDecoder().decode(await readBoundedBytes(response, limit))
}

function attributeMap(tag: string): Map<string, string> {
  const attributes = new Map<string, string>()
  const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
  let match: RegExpExecArray | null

  while ((match = attributePattern.exec(tag)) !== null) {
    const name = (match[1] ?? '').toLowerCase()
    if (name === 'link') continue
    attributes.set(name, match[2] ?? match[3] ?? match[4] ?? '')
  }

  return attributes
}

function largestDeclaredSize(value: string | undefined): number | undefined {
  if (!value) return undefined

  let largest = 0
  for (const token of value.toLowerCase().split(/\s+/)) {
    const match = /^(\d+)x(\d+)$/.exec(token)
    if (!match) continue
    largest = Math.max(largest, Number(match[1]), Number(match[2]))
  }

  return largest || undefined
}

export function discoverHtmlCandidates(html: string, pageUrl: URL): {
  candidates: IconCandidate[]
  manifestUrls: string[]
} {
  const candidates: IconCandidate[] = []
  const manifestUrls: string[] = []
  const linkPattern = /<link\b[^>]*>/gi
  let match: RegExpExecArray | null

  while ((match = linkPattern.exec(html)) !== null) {
    const attributes = attributeMap(match[0])
    const href = attributes.get('href')?.trim()
    if (!href) continue

    let resolved: string
    try {
      resolved = new URL(href, pageUrl).toString()
    } catch {
      continue
    }

    const rel = (attributes.get('rel') ?? '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    if (rel.includes('manifest')) {
      manifestUrls.push(resolved)
      continue
    }

    const isApple = rel.includes('apple-touch-icon') || rel.includes('apple-touch-icon-precomposed')
    const isIcon = rel.includes('icon') || (rel.includes('shortcut') && rel.includes('icon'))

    if (!isApple && !isIcon) continue

    candidates.push({
      url: resolved,
      source: isApple ? 'apple-touch-icon' : 'html-icon',
      mimeType: attributes.get('type') || undefined,
      size: largestDeclaredSize(attributes.get('sizes')),
    })
  }

  return { candidates, manifestUrls: [...new Set(manifestUrls)].slice(0, 1) }
}

export function discoverManifestCandidates(manifest: unknown, manifestUrl: URL): IconCandidate[] {
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    return []
  }

  const icons = (manifest as Record<string, unknown>).icons
  if (!Array.isArray(icons)) return []

  const candidates: IconCandidate[] = []
  for (const icon of icons) {
    if (typeof icon !== 'object' || icon === null || Array.isArray(icon)) continue
    const record = icon as Record<string, unknown>
    if (typeof record.src !== 'string' || !record.src.trim()) continue

    try {
      candidates.push({
        url: new URL(record.src, manifestUrl).toString(),
        source: 'manifest',
        mimeType: typeof record.type === 'string' ? record.type : undefined,
        size: largestDeclaredSize(typeof record.sizes === 'string' ? record.sizes : undefined),
      })
    } catch {
      // Ignore malformed manifest candidates.
    }
  }

  return candidates
}

function conventionalCandidates(pageUrl: URL): IconCandidate[] {
  return conventionalIconPaths.map((path) => ({
    url: new URL(path, pageUrl.origin).toString(),
    source: 'conventional' as const,
  }))
}

export function detectManagedIconMimeType(bytes: Uint8Array): ManagedIconMimeType | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'image/webp'
  }

  if (bytes.length >= 6) {
    const signature = String.fromCharCode(...bytes.slice(0, 6))
    if (signature === 'GIF87a' || signature === 'GIF89a') {
      return 'image/gif'
    }
  }

  if (
    bytes.length >= 4 &&
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x01 &&
    bytes[3] === 0x00
  ) {
    return 'image/x-icon'
  }

  return null
}

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

export async function storeManagedIcon(
  bucket: R2Bucket,
  bytes: Uint8Array,
  sourceUrl: string,
): Promise<ManagedIconDiscoveryResult> {
  if (bytes.byteLength === 0 || bytes.byteLength > automaticIconLimits.maxIconBytes) {
    throw new IconDiscoveryError(`图标大小必须在 1 到 ${automaticIconLimits.maxIconBytes} 字节之间`)
  }

  const mimeType = detectManagedIconMimeType(bytes)
  if (!mimeType || !isManagedIconMimeType(mimeType)) {
    throw new IconDiscoveryError('仅支持 PNG、JPEG、WebP、GIF 或 ICO 作为托管图标')
  }

  const digestInput = Uint8Array.from(bytes)
  const hash = bytesToHex(await crypto.subtle.digest('SHA-256', digestInput))
  const key = managedIconKey(hash, mimeType)

  const existing = await bucket.head(key)
  if (!existing) {
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: mimeType },
      customMetadata: { sourceUrl },
    })
  }

  return {
    kind: 'managed',
    iconType: 'r2',
    icon: key,
    assetUrl: `/api/icon-assets/${key}`,
    sourceUrl,
    mimeType,
    byteLength: bytes.byteLength,
  }
}

async function tryStoreCandidate(
  bucket: R2Bucket,
  candidate: IconCandidate,
): Promise<ManagedIconDiscoveryResult | null> {
  try {
    const response = await fetchSafeExternal(candidate.url, {
      headers: {
        accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/x-icon,*/*;q=0.5',
      },
    })
    if (!response.ok) return null

    const bytes = await readBoundedBytes(response, automaticIconLimits.maxIconBytes)
    return await storeManagedIcon(bucket, bytes, response.url || candidate.url)
  } catch (error) {
    if (error instanceof IconDiscoveryError || error instanceof DOMException) {
      return null
    }
    throw error
  }
}

export async function discoverAndStoreIcon(
  bucket: R2Bucket,
  sourceUrl: string,
): Promise<ManagedIconDiscoveryResult> {
  const pageUrl = assertSafeExternalUrl(sourceUrl)
  const response = await fetchSafeExternal(pageUrl, {
    headers: { accept: 'text/html,application/xhtml+xml,image/*;q=0.8,*/*;q=0.5' },
  })

  if (response.ok) {
    const contentType =
      (response.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase() ?? ''
    if (contentType.startsWith('image/')) {
      const bytes = await readBoundedBytes(response, automaticIconLimits.maxIconBytes)
      return storeManagedIcon(bucket, bytes, response.url || pageUrl.toString())
    }
  }

  const effectivePageUrl = assertSafeExternalUrl(response.url || pageUrl.toString())
  const candidates: IconCandidate[] = []

  if (response.ok) {
    try {
      const html = await readBoundedText(response, automaticIconLimits.maxHtmlBytes)
      const discovered = discoverHtmlCandidates(html, effectivePageUrl)
      candidates.push(...discovered.candidates)

      for (const manifestUrl of discovered.manifestUrls) {
        try {
          const manifestResponse = await fetchSafeExternal(manifestUrl, {
            headers: { accept: 'application/manifest+json,application/json,*/*;q=0.5' },
          })
          if (!manifestResponse.ok) continue
          const manifestText = await readBoundedText(
            manifestResponse,
            automaticIconLimits.maxManifestBytes,
          )
          candidates.push(
            ...discoverManifestCandidates(
              JSON.parse(manifestText),
              new URL(manifestResponse.url || manifestUrl),
            ),
          )
        } catch {
          // Manifest discovery is optional; conventional candidates still apply.
        }
      }
    } catch (error) {
      if (!(error instanceof IconDiscoveryError)) throw error
    }
  }

  candidates.push(...conventionalCandidates(effectivePageUrl))

  for (const candidate of rankIconCandidates(candidates)) {
    const result = await tryStoreCandidate(bucket, candidate)
    if (result) return result
  }

  throw new IconDiscoveryError('没有找到可用的网站图标')
}
