import { Hono } from 'hono'
import {
  automaticIconLimits,
  validateIconFetchRequest,
  type IconDiscoveryResult,
} from '@dockmark/shared'

import { apiError } from '../lib/errors'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'
import {
  discoverAndStoreIcon,
  IconDiscoveryError,
  readBoundedBytes,
  storeManagedIcon,
} from '../services/service-icons'

export const iconsRoute = new Hono<AppEnv>()
export const iconAssetsRoute = new Hono<AppEnv>()

function requireIconBucket(bucket: R2Bucket | undefined): R2Bucket {
  if (!bucket) {
    throw apiError(500, 'config_error', 'Managed icon storage is not configured')
  }
  return bucket
}

function iconError(error: unknown): never {
  if (error instanceof IconDiscoveryError) {
    throw apiError(400, 'validation_failed', error.message)
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    throw apiError(408, 'validation_failed', '图标来源请求超时')
  }

  throw error
}

iconsRoute.post('/fetch', requireAuth, async (c) => {
  const input = requireValidation(validateIconFetchRequest(await readJson(c)))

  try {
    const result: IconDiscoveryResult = await discoverAndStoreIcon(
      requireIconBucket(c.env.ICONS),
      input.url,
    )
    return c.json(result)
  } catch (error) {
    return iconError(error)
  }
})

iconsRoute.post('/upload', requireAuth, async (c) => {
  let form: FormData
  try {
    form = await c.req.raw.formData()
  } catch {
    throw apiError(400, 'validation_failed', '上传内容必须使用 multipart/form-data')
  }

  const file = form.get('file')
  const sourceUrl = form.get('sourceUrl')

  if (!(file instanceof File)) {
    throw apiError(400, 'validation_failed', 'file is required')
  }

  if (typeof sourceUrl !== 'string' || sourceUrl.trim().length === 0) {
    throw apiError(400, 'validation_failed', 'sourceUrl is required')
  }

  if (sourceUrl.length > automaticIconLimits.maxSourceUrlLength) {
    throw apiError(400, 'validation_failed', 'sourceUrl is too long')
  }

  try {
    const parsed = new URL(sourceUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('unsupported protocol')
    }
  } catch {
    throw apiError(400, 'validation_failed', 'sourceUrl must be a valid HTTP(S) URL')
  }

  if (file.size <= 0 || file.size > automaticIconLimits.maxIconBytes) {
    throw apiError(
      400,
      'validation_failed',
      `file must be between 1 and ${automaticIconLimits.maxIconBytes} bytes`,
    )
  }

  try {
    const bytes = await readBoundedBytes(
      new Response(file.stream(), {
        headers: { 'content-length': String(file.size) },
      }),
      automaticIconLimits.maxIconBytes,
    )
    const result: IconDiscoveryResult = await storeManagedIcon(
      requireIconBucket(c.env.ICONS),
      bytes,
      sourceUrl.trim(),
    )
    return c.json(result, 201)
  } catch (error) {
    return iconError(error)
  }
})

iconAssetsRoute.get('/*', requireAuth, async (c) => {
  const key = c.req.path.slice('/api/icon-assets/'.length)

  if (!/^icons\/sha256\/[a-f0-9]{64}\.(png|jpg|webp|gif|ico)$/.test(key)) {
    throw apiError(404, 'not_found', 'Icon asset not found')
  }

  const object = await requireIconBucket(c.env.ICONS).get(key)
  if (!object) {
    throw apiError(404, 'not_found', 'Icon asset not found')
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'private, max-age=31536000, immutable')
  headers.set('x-content-type-options', 'nosniff')
  headers.set('content-disposition', 'inline')

  return new Response(object.body, { headers })
})
