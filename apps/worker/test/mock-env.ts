import type { Bindings } from '../src/lib/env'

type CategoryRecord = {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

type ItemRecord = {
  id: string
  category_id: string | null
  name: string
  description: string | null
  icon: string | null
  icon_type: 'emoji' | 'url' | 'favicon' | 'r2' | 'simple-icons'
  credential_hint: string | null
  note: string | null
  status: 'active' | 'hidden' | 'archived'
  sort_order: number
  created_at: string
  updated_at: string
}

type EndpointRecord = {
  id: string
  item_id: string
  label: string
  url: string
  kind: 'public' | 'lan' | 'tailscale' | 'admin' | 'backup' | 'docs' | 'api'
  is_primary: number
  sort_order: number
  created_at: string
  updated_at: string
}

type TagRecord = {
  id: string
  name: string
  slug: string
  created_at: string
}

type ItemTagRecord = {
  item_id: string
  tag_id: string
}

type Store = {
  categories: CategoryRecord[]
  items: ItemRecord[]
  endpoints: EndpointRecord[]
  tags: TagRecord[]
  itemTags: ItemTagRecord[]
}

type StatementResult = {
  results?: unknown[]
  meta?: { changes: number }
}

function now(): string {
  return '2026-05-29T00:00:00.000Z'
}

function sortByOrderAndName<T extends { sort_order?: number; name?: string; label?: string }>(values: T[]): T[] {
  return [...values].sort((left, right) => {
    const order = (left.sort_order ?? 0) - (right.sort_order ?? 0)
    if (order !== 0) {
      return order
    }

    return (left.name ?? left.label ?? '').localeCompare(right.name ?? right.label ?? '')
  })
}

class MockStatement {
  private values: unknown[] = []

  constructor(
    private readonly store: Store,
    private readonly sql: string,
  ) {}

  bind(...values: unknown[]): MockStatement {
    this.values = values
    return this
  }

  async first<T>(): Promise<T | null> {
    const result = await this.all<T>()
    return (result.results[0] as T | undefined) ?? null
  }

  async all<T>(): Promise<{ results: T[] }> {
    const result = this.execute()
    return { results: (result.results ?? []) as T[] }
  }

  async run(): Promise<D1Result> {
    const result = this.execute()
    return { success: true, meta: { changes: result.meta?.changes ?? 0 } } as D1Result
  }

  execute(): StatementResult {
    const sql = this.sql.replace(/\s+/g, ' ').trim()

    if (sql.startsWith('SELECT value FROM app_metadata')) {
      return { results: [{ value: '0' }] }
    }

    if (sql.startsWith('SELECT * FROM categories WHERE id = ?')) {
      return { results: this.store.categories.filter((category) => category.id === this.values[0]) }
    }

    if (sql.startsWith('SELECT * FROM categories ORDER BY')) {
      return { results: sortByOrderAndName(this.store.categories) }
    }

    if (sql.startsWith('INSERT INTO categories')) {
      this.store.categories.push({
        id: this.values[0] as string,
        name: this.values[1] as string,
        slug: this.values[2] as string,
        icon: this.values[3] as string | null,
        color: this.values[4] as string | null,
        sort_order: this.values[5] as number,
        created_at: now(),
        updated_at: now(),
      })
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('UPDATE categories')) {
      const id = this.values[5] as string
      const category = this.store.categories.find((record) => record.id === id)
      if (!category) return { meta: { changes: 0 } }
      category.name = this.values[0] as string
      category.slug = this.values[1] as string
      category.icon = this.values[2] as string | null
      category.color = this.values[3] as string | null
      category.sort_order = this.values[4] as number
      category.updated_at = now()
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('DELETE FROM categories')) {
      const before = this.store.categories.length
      this.store.categories = this.store.categories.filter((category) => category.id !== this.values[0])
      for (const item of this.store.items) {
        if (item.category_id === this.values[0]) {
          item.category_id = null
        }
      }
      return { meta: { changes: before - this.store.categories.length } }
    }

    if (sql.startsWith('SELECT * FROM tags WHERE id = ?')) {
      return { results: this.store.tags.filter((tag) => tag.id === this.values[0]) }
    }

    if (sql.startsWith('SELECT * FROM tags ORDER BY')) {
      return { results: [...this.store.tags].sort((left, right) => left.name.localeCompare(right.name)) }
    }

    if (sql.startsWith('INSERT INTO tags')) {
      this.store.tags.push({
        id: this.values[0] as string,
        name: this.values[1] as string,
        slug: this.values[2] as string,
        created_at: now(),
      })
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('UPDATE tags')) {
      const id = this.values[2] as string
      const tag = this.store.tags.find((record) => record.id === id)
      if (!tag) return { meta: { changes: 0 } }
      tag.name = this.values[0] as string
      tag.slug = this.values[1] as string
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('DELETE FROM tags')) {
      const before = this.store.tags.length
      this.store.tags = this.store.tags.filter((tag) => tag.id !== this.values[0])
      this.store.itemTags = this.store.itemTags.filter((link) => link.tag_id !== this.values[0])
      return { meta: { changes: before - this.store.tags.length } }
    }

    if (sql.startsWith('SELECT * FROM items WHERE id = ?')) {
      return { results: this.store.items.filter((item) => item.id === this.values[0]) }
    }

    if (sql.startsWith('SELECT * FROM items ORDER BY')) {
      return { results: sortByOrderAndName(this.store.items) }
    }

    if (sql.startsWith('INSERT INTO items')) {
      this.store.items.push({
        id: this.values[0] as string,
        category_id: this.values[1] as string | null,
        name: this.values[2] as string,
        description: this.values[3] as string | null,
        icon: this.values[4] as string | null,
        icon_type: this.values[5] as ItemRecord['icon_type'],
        credential_hint: this.values[6] as string | null,
        note: this.values[7] as string | null,
        status: this.values[8] as ItemRecord['status'],
        sort_order: this.values[9] as number,
        created_at: now(),
        updated_at: now(),
      })
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('UPDATE items')) {
      const id = this.values[9] as string
      const item = this.store.items.find((record) => record.id === id)
      if (!item) return { meta: { changes: 0 } }
      item.category_id = this.values[0] as string | null
      item.name = this.values[1] as string
      item.description = this.values[2] as string | null
      item.icon = this.values[3] as string | null
      item.icon_type = this.values[4] as ItemRecord['icon_type']
      item.credential_hint = this.values[5] as string | null
      item.note = this.values[6] as string | null
      item.status = this.values[7] as ItemRecord['status']
      item.sort_order = this.values[8] as number
      item.updated_at = now()
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('DELETE FROM items')) {
      const before = this.store.items.length
      this.store.items = this.store.items.filter((item) => item.id !== this.values[0])
      this.store.endpoints = this.store.endpoints.filter((endpoint) => endpoint.item_id !== this.values[0])
      this.store.itemTags = this.store.itemTags.filter((link) => link.item_id !== this.values[0])
      return { meta: { changes: before - this.store.items.length } }
    }

    if (sql.startsWith('DELETE FROM endpoints')) {
      const before = this.store.endpoints.length
      this.store.endpoints = this.store.endpoints.filter((endpoint) => endpoint.item_id !== this.values[0])
      return { meta: { changes: before - this.store.endpoints.length } }
    }

    if (sql.startsWith('DELETE FROM item_tags')) {
      const before = this.store.itemTags.length
      this.store.itemTags = this.store.itemTags.filter((link) => link.item_id !== this.values[0])
      return { meta: { changes: before - this.store.itemTags.length } }
    }

    if (sql.startsWith('INSERT INTO endpoints')) {
      this.store.endpoints.push({
        id: this.values[0] as string,
        item_id: this.values[1] as string,
        label: this.values[2] as string,
        url: this.values[3] as string,
        kind: this.values[4] as EndpointRecord['kind'],
        is_primary: this.values[5] as number,
        sort_order: this.values[6] as number,
        created_at: now(),
        updated_at: now(),
      })
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('INSERT OR IGNORE INTO item_tags')) {
      const item_id = this.values[0] as string
      const tag_id = this.values[1] as string
      const exists = this.store.itemTags.some((link) => link.item_id === item_id && link.tag_id === tag_id)
      if (!exists) {
        this.store.itemTags.push({ item_id, tag_id })
      }
      return { meta: { changes: exists ? 0 : 1 } }
    }

    if (sql.startsWith('SELECT * FROM endpoints WHERE item_id IN')) {
      const ids = new Set(this.values as string[])
      return { results: sortByOrderAndName(this.store.endpoints.filter((endpoint) => ids.has(endpoint.item_id))) }
    }

    if (sql.startsWith('SELECT item_tags.item_id, tags.*')) {
      const ids = new Set(this.values as string[])
      return {
        results: this.store.itemTags
          .filter((link) => ids.has(link.item_id))
          .map((link) => ({
            item_id: link.item_id,
            ...this.store.tags.find((tag) => tag.id === link.tag_id),
          }))
          .filter((row) => row.id),
      }
    }

    throw new Error(`Unhandled SQL in mock: ${sql}`)
  }
}

class MockDb {
  constructor(private readonly store: Store) {}

  prepare(sql: string): MockStatement {
    return new MockStatement(this.store, sql)
  }

  async batch(statements: MockStatement[]): Promise<D1Result[]> {
    return statements.map((statement) => ({
      success: true,
      meta: { changes: statement.execute().meta?.changes ?? 0 },
    })) as D1Result[]
  }
}

export function createMockEnv(): Bindings {
  const kv = new Map<string, string>()
  const store: Store = {
    categories: [],
    items: [],
    endpoints: [],
    tags: [],
    itemTags: [],
  }

  return {
    AUTH_MODE: 'development',
    APP_VERSION: '0.1.0-test',
    ASSETS: {
      fetch: (request: Request) => {
        const url = new URL(request.url)

        if (url.pathname === '/' || url.pathname === '/index.html') {
          return Promise.resolve(new Response('<!doctype html><div id="app"></div>', {
            headers: { 'content-type': 'text/html' },
          }))
        }

        return Promise.resolve(new Response('Not found', { status: 404 }))
      },
    } as Fetcher,
    DB: new MockDb(store) as unknown as D1Database,
    KV: {
      put: (key: string, value: string) => {
        kv.set(key, value)
        return Promise.resolve()
      },
      get: (key: string) => Promise.resolve(kv.get(key) ?? null),
    } as unknown as KVNamespace,
  }
}
