import { describe, expect, it } from 'vitest'

import {
  base64ByteLength,
  dockmarkAssetExportSchemaVersion,
  validatePortableDockmarkExportDocument,
} from './import-export-assets'
import { dockmarkExportFormat, dockmarkExportSource } from './import-export'

const timestamp = '2026-09-11T00:00:00.000Z'
const hash = 'a'.repeat(64)
const key = `icons/sha256/${hash}.png`

function v2Document() {
  return {
    format: dockmarkExportFormat,
    source: dockmarkExportSource,
    appVersion: '0.1.0-test',
    schemaVersion: dockmarkAssetExportSchemaVersion,
    generatedAt: timestamp,
    categories: [],
    tags: [],
    items: [
      {
        id: 'item_grafana',
        categoryId: null,
        name: 'Grafana',
        description: null,
        icon: key,
        iconType: 'r2',
        credentialHint: null,
        note: null,
        status: 'active',
        sortOrder: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        endpoints: [
          {
            id: 'end_grafana',
            label: 'Public',
            url: 'https://grafana.example.com',
            kind: 'public',
            isPrimary: true,
            sortOrder: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
        tagIds: [],
      },
    ],
    assets: [
      {
        key,
        hash,
        mimeType: 'image/png',
        byteLength: 8,
        dataBase64: 'iVBORw0KGgo=',
      },
    ],
  }
}

describe('asset-aware Dockmark exports', () => {
  it('accepts schema v2 with matching managed icon assets', () => {
    const result = validatePortableDockmarkExportDocument(v2Document())

    expect(result).toMatchObject({
      ok: true,
      value: {
        schemaVersion: 2,
        document: { items: [{ icon: key, iconType: 'r2' }] },
        assets: [{ key, hash, mimeType: 'image/png', byteLength: 8 }],
      },
    })
  })

  it('keeps schema v1 documents supported', () => {
    const document = v2Document()
    const { assets: _assets, ...withoutAssets } = document
    const result = validatePortableDockmarkExportDocument({
      ...withoutAssets,
      schemaVersion: 1,
      items: [{ ...withoutAssets.items[0], icon: null, iconType: 'favicon' }],
    })

    expect(result).toMatchObject({ ok: true, value: { schemaVersion: 1, assets: [] } })
  })

  it('rejects missing managed assets and mismatched hashes', () => {
    const missing = v2Document()
    missing.assets = []
    expect(validatePortableDockmarkExportDocument(missing)).toEqual({
      ok: false,
      errors: ['managed icon asset is missing for service: Grafana'],
    })

    const mismatched = v2Document()
    mismatched.assets[0].hash = 'b'.repeat(64)
    const result = validatePortableDockmarkExportDocument(mismatched)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain('assets.0.hash must match the key hash')
    }
  })

  it('calculates canonical base64 byte lengths', () => {
    expect(base64ByteLength('iVBORw0KGgo=')).toBe(8)
    expect(base64ByteLength('not base64')).toBe(-1)
  })
})
