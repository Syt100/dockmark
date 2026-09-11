import { Hono } from 'hono'
import { validateImportMode, type ImportResultResponse } from '@dockmark/shared'

import { apiError } from '../lib/errors'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'
import {
  buildPortableExportDocument,
  importPortableDocument,
  previewPortableImport,
} from '../services/portable-import-export'

export const importExportRoute = new Hono<AppEnv>()

function readImportRequest(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw apiError(400, 'validation_failed', 'body must be an object', {
      body: ['body must be an object'],
    })
  }

  const record = input as Record<string, unknown>
  const mode = requireValidation(validateImportMode(record.mode))

  if (!('document' in record)) {
    throw apiError(400, 'validation_failed', 'document is required', {
      body: ['document is required'],
    })
  }

  return { mode, document: record.document }
}

importExportRoute.get('/export', requireAuth, async (c) => {
  try {
    const document = await buildPortableExportDocument(c.env, c.env.APP_VERSION)

    return c.json(document, 200, {
      'content-disposition': `attachment; filename="dockmark-export-${document.generatedAt.slice(0, 10)}.json"`,
    })
  } catch (caught) {
    throw apiError(
      500,
      'internal_error',
      caught instanceof Error ? caught.message : 'Failed to build export document',
    )
  }
})

importExportRoute.post('/preview', requireAuth, async (c) => {
  const request = readImportRequest(await readJson(c))
  const preview = await previewPortableImport(c.env.DB, request.mode, request.document)

  return c.json(preview)
})

importExportRoute.post('/import', requireAuth, async (c) => {
  const request = readImportRequest(await readJson(c))

  try {
    const result = await importPortableDocument(c.env, request.mode, request.document)
    const body: ImportResultResponse = result
    return c.json(body)
  } catch (caught) {
    throw apiError(
      400,
      'validation_failed',
      caught instanceof Error ? caught.message : 'Import document is invalid',
    )
  }
})
