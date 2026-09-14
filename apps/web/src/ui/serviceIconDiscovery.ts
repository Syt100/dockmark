import {
  automaticIconLimits,
  conventionalIconPaths,
  rankIconCandidates,
  type IconCandidate,
} from '@dockmark/shared'

export type BrowserIconDiscoveryResult =
  | {
      kind: 'blob'
      blob: Blob
      sourceUrl: string
    }
  | {
      kind: 'external'
      sourceUrl: string
      width?: number
      height?: number
    }

function largestSize(value: string | null): number | undefined {
  if (!value) return undefined

  let largest = 0
  for (const token of value.toLowerCase().split(/\s+/)) {
    const match = /^(\d+)x(\d+)$/.exec(token)
    if (!match) continue
    largest = Math.max(largest, Number(match[1]), Number(match[2]))
  }

  return largest || undefined
}

function declaredCandidates(
  document: Document,
  pageUrl: URL,
): {
  candidates: IconCandidate[]
  manifestUrls: string[]
} {
  const candidates: IconCandidate[] = []
  const manifestUrls: string[] = []

  for (const link of document.querySelectorAll('link[href]')) {
    const href = link.getAttribute('href')?.trim()
    if (!href) continue

    let url: string
    try {
      url = new URL(href, pageUrl).toString()
    } catch {
      continue
    }

    const rel = (link.getAttribute('rel') ?? '').toLowerCase().split(/\s+/).filter(Boolean)

    if (rel.includes('manifest')) {
      manifestUrls.push(url)
      continue
    }

    const isApple = rel.includes('apple-touch-icon') || rel.includes('apple-touch-icon-precomposed')
    const isIcon = rel.includes('icon') || (rel.includes('shortcut') && rel.includes('icon'))
    if (!isApple && !isIcon) continue

    candidates.push({
      url,
      source: isApple ? 'apple-touch-icon' : 'html-icon',
      mimeType: link.getAttribute('type') || undefined,
      size: largestSize(link.getAttribute('sizes')),
    })
  }

  return {
    candidates,
    manifestUrls: [...new Set(manifestUrls)].slice(0, 1),
  }
}

function manifestCandidates(manifest: unknown, manifestUrl: URL): IconCandidate[] {
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) return []
  const icons = (manifest as Record<string, unknown>).icons
  if (!Array.isArray(icons)) return []

  const result: IconCandidate[] = []
  for (const icon of icons) {
    if (typeof icon !== 'object' || icon === null || Array.isArray(icon)) continue
    const record = icon as Record<string, unknown>
    if (typeof record.src !== 'string' || !record.src.trim()) continue

    try {
      result.push({
        url: new URL(record.src, manifestUrl).toString(),
        source: 'manifest',
        mimeType: typeof record.type === 'string' ? record.type : undefined,
        size: largestSize(typeof record.sizes === 'string' ? record.sizes : null),
      })
    } catch {
      // Ignore malformed manifest entries.
    }
  }
  return result
}

async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  return fetch(url, {
    credentials: 'omit',
    mode: 'cors',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    headers: { accept },
    signal: AbortSignal.timeout(automaticIconLimits.timeoutMs),
  })
}

async function readBoundedBytes(
  response: Response,
  limit: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const declaredLength = Number(response.headers.get('content-length') ?? 0)
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    throw new Error(`响应内容超过 ${limit} 字节限制`)
  }

  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength > limit) throw new Error(`响应内容超过 ${limit} 字节限制`)
    return Uint8Array.from(bytes)
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
        throw new Error(`响应内容超过 ${limit} 字节限制`)
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

async function readBoundedBlob(response: Response, limit: number): Promise<Blob> {
  const bytes = await readBoundedBytes(response, limit)
  return new Blob([bytes], {
    type: response.headers.get('content-type')?.split(';')[0]?.trim() ?? '',
  })
}

async function readBlobCandidate(
  candidate: IconCandidate,
): Promise<BrowserIconDiscoveryResult | null> {
  try {
    const response = await fetchWithTimeout(
      candidate.url,
      'image/avif,image/webp,image/png,image/jpeg,image/gif,image/x-icon,*/*;q=0.5',
    )
    if (!response.ok) return null

    const blob = await readBoundedBlob(response, automaticIconLimits.maxIconBytes)
    if (blob.size <= 0) return null

    if (blob.type.toLowerCase() === 'image/svg+xml') {
      return { kind: 'external', sourceUrl: response.url || candidate.url }
    }

    return { kind: 'blob', blob, sourceUrl: response.url || candidate.url }
  } catch {
    return null
  }
}

function probeExternalImage(url: string): Promise<BrowserIconDiscoveryResult | null> {
  return new Promise((resolve) => {
    const image = new Image()
    let settled = false

    const finish = (result: BrowserIconDiscoveryResult | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      image.onload = null
      image.onerror = null
      resolve(result)
    }

    const timer = window.setTimeout(() => finish(null), automaticIconLimits.timeoutMs)
    image.referrerPolicy = 'no-referrer'
    image.onload = () =>
      finish({
        kind: 'external',
        sourceUrl: url,
        width: image.naturalWidth || undefined,
        height: image.naturalHeight || undefined,
      })
    image.onerror = () => finish(null)
    image.src = url
  })
}

function conventionalCandidates(pageUrl: URL): IconCandidate[] {
  return conventionalIconPaths.map((path) => ({
    url: new URL(path, pageUrl.origin).toString(),
    source: 'conventional' as const,
  }))
}

export async function discoverIconInBrowser(
  sourceUrl: string,
): Promise<BrowserIconDiscoveryResult> {
  const source = new URL(sourceUrl)
  if (source.protocol !== 'http:' && source.protocol !== 'https:') {
    throw new Error('浏览器图标获取仅支持 HTTP 或 HTTPS 地址')
  }

  let effectiveUrl = source
  const candidates: IconCandidate[] = []

  try {
    const pageResponse = await fetchWithTimeout(
      source.toString(),
      'text/html,application/xhtml+xml,image/*;q=0.8,*/*;q=0.5',
    )

    if (pageResponse.ok) {
      effectiveUrl = new URL(pageResponse.url || source.toString())
      const contentType = (pageResponse.headers.get('content-type') ?? '').toLowerCase()

      if (contentType.startsWith('image/')) {
        const blob = await readBoundedBlob(pageResponse, automaticIconLimits.maxIconBytes)
        if (blob.size > 0) {
          if (blob.type.toLowerCase() === 'image/svg+xml') {
            return { kind: 'external', sourceUrl: effectiveUrl.toString() }
          }
          return { kind: 'blob', blob, sourceUrl: effectiveUrl.toString() }
        }
      } else {
        const html = await readBoundedText(pageResponse, automaticIconLimits.maxHtmlBytes)
        const document = new DOMParser().parseFromString(html, 'text/html')
        const declared = declaredCandidates(document, effectiveUrl)
        candidates.push(...declared.candidates)

        for (const manifestUrl of declared.manifestUrls) {
          try {
            const response = await fetchWithTimeout(
              manifestUrl,
              'application/manifest+json,application/json,*/*;q=0.5',
            )
            if (!response.ok) continue
            const text = await readBoundedText(response, automaticIconLimits.maxManifestBytes)
            candidates.push(
              ...manifestCandidates(JSON.parse(text), new URL(response.url || manifestUrl)),
            )
          } catch {
            // Manifest discovery is optional.
          }
        }
      }
    }
  } catch {
    // Browser CORS/PNA/mixed-content failure falls through to conventional image probing only.
  }

  candidates.push(...conventionalCandidates(effectiveUrl))
  const ranked = rankIconCandidates(candidates)

  for (const candidate of ranked) {
    const readable = await readBlobCandidate(candidate)
    if (readable) return readable
  }

  for (const candidate of ranked) {
    const external = await probeExternalImage(candidate.url)
    if (external) return external
  }

  throw new Error('浏览器没有找到可用的网站图标；可能受到 CORS、混合内容或网络策略限制')
}
