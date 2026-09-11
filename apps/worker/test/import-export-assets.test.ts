import { describe, expect, it } from 'vitest'

import {
  dockmarkAssetExportSchemaVersion,
  dockmarkExportFormat,
  dockmarkExportSchemaVersion,
  dockmarkExportSource,
  managedIconKey,
  type DockmarkExportDocument,
  type DockmarkExportDocumentV2,
} from '@dockmark/shared'

import app from '../src/index'
import { createMockEnv } from './mock-env'

const timestamp = '2026-09-11T00:00:00.000Z'
const headers = { 'content-type': 'application/json' }
const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])

type MemoryObject = {
  bytes: Uint8Array<ArrayBuffer>
  contentType: string
}

class MemoryR2 {
  private readonly objects = new Map<string, MemoryObject>()

  asBucket(): R2Bucket {
    return this as unknown as R2Bucket
  }

  count(): number {
    return this.objects.size
  }

  has(key: string): boolean {
    return this.objects.has(key)
  }

  seed(key: string, bytes: Uint8Array, contentType: string) {
    this.objects.set(key, { bytes: Uint8Array.from(bytes), contentType })
  }

  async head(key: string): Promise<R2Object | null> {
    const object = this.objects.get(key)
    if (!object) return null

    return {
      key,
      size: object.bytes.byteLength,
    } as unknown as R2Object
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    const object = this.objects.get(key)
    if (!object) return null

    return {
      key,
      size: object.bytes.byteLength,
      httpMetadata: { contentType: object.contentType },
      arrayBuffer: async () => Uint8Array.from(object.bytes).buffer,
    } as unknown as R2ObjectBody
  }

  async put(
    key: string,
    value: unknown,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<R2Object> {
    if (!(value instanceof Uint8Array)) {
      throw new Error('MemoryR2 only accepts Uint8Array test values')
    }

    this.objects.set(key, {
      bytes: Uint8Array.from(value),
      contentType: options?.httpMetadata?.contentType ?? 'application/octet-stream',
    })

    return (await this.head(key)) as R2Object
  }
}

function v1Document(): DockmarkExportDocument {
  return {
    format: dockmarkExportFormat,
    source: dockmarkExportSource,
    appVersion: '0.1.0-test',
    schemaVersion: dockmarkExportSchemaVersion,
    generatedAt: timestamp,
    categories: [],
    tags: [],
    items: [
      {
        id: 'item_grafana',
        categoryId: null,
        name: 'Grafana',
        description: null,
        icon: null,
        iconType: 'favicon',
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
            url: 'https://grafana.example.test',
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
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes))
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

async function importDocument(
  env: ReturnType<typeof createMockEnv>,
  document: unknown,
): Promise<Response> {
  return app.request(
    '/api/import-export/import',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ mode: 'additive', document }),
    },
    env,
  )
}

async function exportedManagedDocument() {
  const r2 = new MemoryR2()
  const env = createMockEnv({ ICONS: r2.asBucket() })
  expect((await importDocument(env, v1Document())).status).toBe(200)

  const hash = await sha256Hex(pngBytes)
  const key = managedIconKey(hash, 'image/png')
  r2.seed(key, pngBytes, 'image/png')
  env.__testStore.items[0]!.icon = key
  env.__testStore.items[0]!.icon_type = 'r2'

  const response = await app.request('/api/import-export/export', {}, env)
  expect(response.status).toBe(200)

  return {
    key,
    document: (await response.json()) as DockmarkExportDocumentV2,
  }
}

describe('managed icon import/export portability', () => {
  it('exports referenced R2 icons once in schema v2', async () => {
    const { key, document } = await exportedManagedDocument()

    expect(document.schemaVersion).toBe(dockmarkAssetExportSchemaVersion)
    expect(document.items[0]).toMatchObject({ iconType: 'r2', icon: key })
    expect(document.assets).toHaveLength(1)
    expect(document.assets[0]).toMatchObject({
      key,
      mimeType: 'image/png',
      byteLength: pngBytes.byteLength,
      dataBase64: bytesToBase64(pngBytes),
    })
  })

  it('restores verified managed assets before importing their references', async () => {
    const { key, document } = await exportedManagedDocument()
    const targetR2 = new MemoryR2()
    const targetEnv = createMockEnv({ ICONS: targetR2.asBucket() })

    const response = await importDocument(targetEnv, document)

    expect(response.status).toBe(200)
    expect(targetR2.has(key)).toBe(true)
    expect(targetEnv.__testStore.items[0]).toMatchObject({ icon: key, icon_type: 'r2' })
  })

  it('rejects tampered icon bytes before writing R2 or D1', async () => {
    const { document } = await exportedManagedDocument()
    const tampered = structuredClone(document)
    const altered = Uint8Array.from(pngBytes)
    altered[altered.length - 1] = 0x01
    tampered.assets[0]!.dataBase64 = bytesToBase64(altered)

    const targetR2 = new MemoryR2()
    const targetEnv = createMockEnv({ ICONS: targetR2.asBucket() })
    const response = await importDocument(targetEnv, tampered)

    expect(response.status).toBe(400)
    const body = (await response.json()) as { error: { message: string } }
    expect(body.error.message).toContain('SHA-256')
    expect(targetR2.count()).toBe(0)
    expect(targetEnv.__testStore.items).toHaveLength(0)
  })
})
