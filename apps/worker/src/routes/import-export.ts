import { Hono } from 'hono'
import { validateImportMode, type ImportResultResponse } from '@dockmark/shared'

import { apiError } from '../lib/errors'
import type { AppEnv } from '../lib/env'
import { readJson, requireValidation } from '../lib/http'
import { requireAuth } from '../middleware/auth'
import { buildExportDocument, importDocument, previewImport } from '../services/import-export'

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
  const document = await buildExportDocument(c.env.DB)

  return c.json(document, 200, {
    'content-disposition': `attachment; filename="dockmark-export-${document.generatedAt.slice(0, 10)}.json"`,
  })
})

importExportRoute.post('/preview', requireAuth, async (c) => {
  const request = readImportRequest(await readJson(c))
  const preview = await previewImport(c.env.DB, request.mode, request.document)
  const { document: _document, ...body } = preview

  return c.json(body)
})

importExportRoute.post('/import', requireAuth, async (c) => {
  const request = readImportRequest(await readJson(c))

  try {
    const imported = await importDocument(c.env, request.mode, request.document)
    const body: ImportResultResponse = { imported }
    return c.json(body)
  } catch (caught) {
    throw apiError(
      400,
      'validation_failed',
      caught instanceof Error ? caught.message : 'Import document is invalid',
    )
  }
})
