import { describe, expect, it } from 'vitest'

import {
  dockmarkExportSchemaVersion,
  summarizeImportDocument,
  validateImportLimits,
  validateDockmarkExportDocument,
  validateImportMode,
} from './import-export'

const timestamp = '2026-06-21T00:00:00.000Z'

function validDocument() {
  return {
    schemaVersion: dockmarkExportSchemaVersion,
    generatedAt: timestamp,
    categories: [
      {
        id: 'cat_media',
        name: 'Media',
        slug: 'media',
        icon: null,
        color: null,
        sortOrder: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    tags: [
      {
        id: 'tag_photo',
        name: 'Photo',
        slug: 'photo',
        createdAt: timestamp,
      },
    ],
    items: [
      {
        id: 'item_immich',
        categoryId: 'cat_media',
        name: 'Immich',
        description: null,
        icon: null,
        iconType: 'favicon',
        credentialHint: 'Vaultwarden search Immich',
        note: null,
        status: 'active',
        sortOrder: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        endpoints: [
          {
            id: 'end_immich',
            label: 'Public',
            url: 'https://photos.example.com',
            kind: 'public',
            isPrimary: true,
            sortOrder: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
        tagIds: ['tag_photo'],
      },
    ],
  }
}

describe('import/export contracts', () => {
  it('validates a portable export document', () => {
    const result = validateDockmarkExportDocument(validDocument())

    expect(result).toMatchObject({
      ok: true,
      value: {
        items: [
          {
            id: 'item_immich',
            endpoints: [{ id: 'end_immich' }],
            tagIds: ['tag_photo'],
          },
        ],
      },
    })

    if (result.ok) {
      expect(summarizeImportDocument(result.value)).toEqual({
        categories: 1,
        tags: 1,
        items: 1,
        endpoints: 1,
      })
    }
  })

  it('rejects unsupported schema versions', () => {
    const result = validateDockmarkExportDocument({
      ...validDocument(),
      schemaVersion: 999,
    })

    expect(result).toEqual({
      ok: false,
      errors: ['schemaVersion must be 1'],
    })
  })

  it('rejects missing category and tag relationships', () => {
    const document = validDocument()
    document.items[0].categoryId = 'cat_missing'
    document.items[0].tagIds = ['tag_missing']

    const result = validateDockmarkExportDocument(document)

    expect(result).toEqual({
      ok: false,
      errors: [
        'items.item_immich.categoryId references a missing category',
        'items.item_immich.tagIds references a missing tag: tag_missing',
      ],
    })
  })

  it('rejects invalid endpoints', () => {
    const document = validDocument()
    document.items[0].endpoints[0].url = 'not-a-url'
    document.items[0].endpoints[0].isPrimary = false

    const result = validateDockmarkExportDocument(document)

    expect(result).toEqual({
      ok: false,
      errors: [
        'items.0.endpoints.0.url must be a valid URL',
        'items.0.endpoints must include exactly one primary endpoint',
      ],
    })
  })

  it('rejects forbidden secret fields anywhere in the document', () => {
    const document = validDocument()

    const result = validateDockmarkExportDocument({
      ...document,
      items: [
        {
          ...document.items[0],
          password: 'secret',
        },
      ],
    })

    expect(result).toEqual({
      ok: false,
      errors: ['items.0.password must not be stored in Dockmark exports'],
    })
  })

  it('validates import modes', () => {
    expect(validateImportMode('additive')).toEqual({ ok: true, value: 'additive' })
    expect(validateImportMode('additiveSkipConflicts')).toEqual({
      ok: true,
      value: 'additiveSkipConflicts',
    })
    expect(validateImportMode('merge')).toEqual({
      ok: false,
      errors: ['mode must be one of: additive, additiveSkipConflicts, replaceAll'],
    })
  })

  it('validates import safety limits', () => {
    expect(
      validateImportLimits({
        byteLength: 1024 * 1024 + 1,
        summary: {
          categories: 501,
          tags: 1001,
          items: 2001,
          endpoints: 8001,
        },
      }),
    ).toEqual([
      'document size must be at most 1048576 bytes',
      'categories must be at most 500',
      'tags must be at most 1000',
      'items must be at most 2000',
      'endpoints must be at most 8000',
    ])
  })
})
