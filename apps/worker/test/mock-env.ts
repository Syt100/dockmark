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

type AuthUserRecord = {
  id: string
  email: string
  display_name: string | null
  password_hash: string
  password_algo: string
  is_admin: number
  disabled_at: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
}

type AuthSessionRecord = {
  id: string
  user_id: string
  session_hash: string
  expires_at: string
  created_at: string
  last_seen_at: string
  revoked_at: string | null
}

type Store = {
  metadata: Map<string, string>
  kvPutOptions: Map<string, KVNamespacePutOptions>
  categories: CategoryRecord[]
  items: ItemRecord[]
  endpoints: EndpointRecord[]
  tags: TagRecord[]
  itemTags: ItemTagRecord[]
  authUsers: AuthUserRecord[]
  authSessions: AuthSessionRecord[]
  authSessionTouchCount: number
  failNextNavCacheVersionIncrement: boolean
}

type StatementResult = {
  results?: unknown[]
  meta?: { changes: number }
}

function now(): string {
  return new Date().toISOString()
}

function sortByOrderAndName<T extends { sort_order?: number; name?: string; label?: string }>(
  values: T[],
): T[] {
  return [...values].sort((left, right) => {
    const order = (left.sort_order ?? 0) - (right.sort_order ?? 0)
    if (order !== 0) {
      return order
    }

    return (left.name ?? left.label ?? '').localeCompare(right.name ?? right.label ?? '')
  })
}

function uniqueConstraintFailed(columns: string): Error {
  return new Error(`D1_ERROR: UNIQUE constraint failed: ${columns}`)
}

function cloneStoreState(store: Store): Store {
  return {
    metadata: new Map(store.metadata),
    kvPutOptions: new Map(store.kvPutOptions),
    categories: structuredClone(store.categories),
    items: structuredClone(store.items),
    endpoints: structuredClone(store.endpoints),
    tags: structuredClone(store.tags),
    itemTags: structuredClone(store.itemTags),
    authUsers: structuredClone(store.authUsers),
    authSessions: structuredClone(store.authSessions),
    authSessionTouchCount: store.authSessionTouchCount,
    failNextNavCacheVersionIncrement: store.failNextNavCacheVersionIncrement,
  }
}

function restoreStoreState(store: Store, snapshot: Store): void {
  store.metadata = snapshot.metadata
  store.kvPutOptions = snapshot.kvPutOptions
  store.categories = snapshot.categories
  store.items = snapshot.items
  store.endpoints = snapshot.endpoints
  store.tags = snapshot.tags
  store.itemTags = snapshot.itemTags
  store.authUsers = snapshot.authUsers
  store.authSessions = snapshot.authSessions
  store.authSessionTouchCount = snapshot.authSessionTouchCount
  store.failNextNavCacheVersionIncrement = snapshot.failNextNavCacheVersionIncrement
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
    return {
      success: true,
      meta: { changes: result.meta?.changes ?? 0 },
    } as D1Result
  }

  execute(): StatementResult {
    const sql = this.sql.replace(/\s+/g, ' ').trim()

    if (sql.startsWith('SELECT value FROM app_metadata')) {
      const value = this.store.metadata.get(this.values[0] as string)
      return { results: value ? [{ value }] : [] }
    }

    if (sql.startsWith('INSERT INTO app_metadata')) {
      if (this.store.failNextNavCacheVersionIncrement) {
        this.store.failNextNavCacheVersionIncrement = false
        throw new Error('D1_ERROR: simulated nav cache version increment failure')
      }

      const key = this.values[0] as string
      const current = this.store.metadata.get(key)

      if (!current) {
        this.store.metadata.set(key, '3')
      } else {
        this.store.metadata.set(key, String(Number.parseInt(current, 10) + 1))
      }

      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('SELECT COUNT(*) AS count FROM auth_users')) {
      return { results: [{ count: this.store.authUsers.length }] }
    }

    if (sql.startsWith('SELECT * FROM auth_users WHERE email = ?')) {
      return {
        results: this.store.authUsers.filter((user) => user.email === this.values[0]),
      }
    }

    if (sql.startsWith('INSERT INTO auth_users')) {
      this.store.authUsers.push({
        id: this.values[0] as string,
        email: this.values[1] as string,
        display_name: this.values[2] as string | null,
        password_hash: this.values[3] as string,
        password_algo: this.values[4] as string,
        is_admin: 1,
        disabled_at: null,
        created_at: now(),
        updated_at: now(),
        last_login_at: null,
      })
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('SELECT * FROM auth_users WHERE id = ?')) {
      return {
        results: this.store.authUsers.filter((user) => user.id === this.values[0]),
      }
    }

    if (sql.startsWith('UPDATE auth_users SET last_login_at')) {
      const user = this.store.authUsers.find((record) => record.id === this.values[0])
      if (!user) return { meta: { changes: 0 } }
      user.last_login_at = now()
      user.updated_at = now()
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('INSERT INTO auth_sessions')) {
      this.store.authSessions.push({
        id: this.values[0] as string,
        user_id: this.values[1] as string,
        session_hash: this.values[2] as string,
        expires_at: this.values[3] as string,
        created_at: now(),
        last_seen_at: now(),
        revoked_at: null,
      })
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('SELECT * FROM auth_sessions WHERE id = ?')) {
      return {
        results: this.store.authSessions.filter((session) => session.id === this.values[0]),
      }
    }

    if (sql.startsWith('SELECT auth_sessions.id AS session_id')) {
      const session = this.store.authSessions.find(
        (record) => record.session_hash === this.values[0],
      )
      const user = session
        ? this.store.authUsers.find((record) => record.id === session.user_id)
        : null

      if (!session || !user) {
        return { results: [] }
      }

      return {
        results: [
          {
            session_id: session.id,
            user_id: session.user_id,
            session_hash: session.session_hash,
            expires_at: session.expires_at,
            session_created_at: session.created_at,
            last_seen_at: session.last_seen_at,
            revoked_at: session.revoked_at,
            user_id_value: user.id,
            email: user.email,
            display_name: user.display_name,
            password_hash: user.password_hash,
            password_algo: user.password_algo,
            is_admin: user.is_admin,
            disabled_at: user.disabled_at,
            user_created_at: user.created_at,
            updated_at: user.updated_at,
            last_login_at: user.last_login_at,
          },
        ],
      }
    }

    if (sql.startsWith('UPDATE auth_sessions SET last_seen_at')) {
      const session = this.store.authSessions.find(
        (record) => record.id === this.values[0] && !record.revoked_at,
      )
      if (!session) return { meta: { changes: 0 } }
      session.last_seen_at = now()
      this.store.authSessionTouchCount += 1
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('UPDATE auth_sessions SET revoked_at')) {
      const session = this.store.authSessions.find(
        (record) => record.session_hash === this.values[0] && !record.revoked_at,
      )
      if (!session) return { meta: { changes: 0 } }
      session.revoked_at = now()
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('SELECT * FROM categories WHERE id = ?')) {
      return {
        results: this.store.categories.filter((category) => category.id === this.values[0]),
      }
    }

    if (sql.startsWith('SELECT * FROM categories ORDER BY')) {
      return { results: sortByOrderAndName(this.store.categories) }
    }

    if (sql.startsWith('INSERT INTO categories')) {
      const slug = this.values[2] as string
      if (this.store.categories.some((category) => category.slug === slug)) {
        throw uniqueConstraintFailed('categories.slug')
      }

      this.store.categories.push({
        id: this.values[0] as string,
        name: this.values[1] as string,
        slug,
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
      const slug = this.values[1] as string
      if (this.store.categories.some((record) => record.id !== id && record.slug === slug)) {
        throw uniqueConstraintFailed('categories.slug')
      }

      category.name = this.values[0] as string
      category.slug = slug
      category.icon = this.values[2] as string | null
      category.color = this.values[3] as string | null
      category.sort_order = this.values[4] as number
      category.updated_at = now()
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('DELETE FROM categories')) {
      const before = this.store.categories.length
      this.store.categories = this.store.categories.filter(
        (category) => category.id !== this.values[0],
      )
      for (const item of this.store.items) {
        if (item.category_id === this.values[0]) {
          item.category_id = null
        }
      }
      return { meta: { changes: before - this.store.categories.length } }
    }

    if (sql.startsWith('SELECT * FROM tags WHERE id = ?')) {
      return {
        results: this.store.tags.filter((tag) => tag.id === this.values[0]),
      }
    }

    if (sql.startsWith('SELECT * FROM tags ORDER BY')) {
      return {
        results: [...this.store.tags].sort((left, right) => left.name.localeCompare(right.name)),
      }
    }

    if (sql.startsWith('INSERT INTO tags')) {
      const name = this.values[1] as string
      const slug = this.values[2] as string
      if (this.store.tags.some((tag) => tag.name === name)) {
        throw uniqueConstraintFailed('tags.name')
      }
      if (this.store.tags.some((tag) => tag.slug === slug)) {
        throw uniqueConstraintFailed('tags.slug')
      }

      this.store.tags.push({
        id: this.values[0] as string,
        name,
        slug,
        created_at: now(),
      })
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('UPDATE tags')) {
      const id = this.values[2] as string
      const tag = this.store.tags.find((record) => record.id === id)
      if (!tag) return { meta: { changes: 0 } }
      const name = this.values[0] as string
      const slug = this.values[1] as string
      if (this.store.tags.some((record) => record.id !== id && record.name === name)) {
        throw uniqueConstraintFailed('tags.name')
      }
      if (this.store.tags.some((record) => record.id !== id && record.slug === slug)) {
        throw uniqueConstraintFailed('tags.slug')
      }

      tag.name = name
      tag.slug = slug
      return { meta: { changes: 1 } }
    }

    if (sql.startsWith('DELETE FROM tags')) {
      const before = this.store.tags.length
      this.store.tags = this.store.tags.filter((tag) => tag.id !== this.values[0])
      this.store.itemTags = this.store.itemTags.filter((link) => link.tag_id !== this.values[0])
      return { meta: { changes: before - this.store.tags.length } }
    }

    if (sql.startsWith('SELECT * FROM items WHERE id = ?')) {
      return {
        results: this.store.items.filter((item) => item.id === this.values[0]),
      }
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
      this.store.endpoints = this.store.endpoints.filter(
        (endpoint) => endpoint.item_id !== this.values[0],
      )
      this.store.itemTags = this.store.itemTags.filter((link) => link.item_id !== this.values[0])
      return { meta: { changes: before - this.store.items.length } }
    }

    if (sql.startsWith('DELETE FROM endpoints')) {
      const before = this.store.endpoints.length
      this.store.endpoints = this.store.endpoints.filter(
        (endpoint) => endpoint.item_id !== this.values[0],
      )
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
      const exists = this.store.itemTags.some(
        (link) => link.item_id === item_id && link.tag_id === tag_id,
      )
      if (!exists) {
        this.store.itemTags.push({ item_id, tag_id })
      }
      return { meta: { changes: exists ? 0 : 1 } }
    }

    if (sql.startsWith('SELECT * FROM endpoints WHERE item_id IN')) {
      const ids = new Set(this.values as string[])
      return {
        results: sortByOrderAndName(
          this.store.endpoints.filter((endpoint) => ids.has(endpoint.item_id)),
        ),
      }
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
    const snapshot = cloneStoreState(this.store)

    try {
      return statements.map((statement) => ({
        success: true,
        meta: { changes: statement.execute().meta?.changes ?? 0 },
      })) as D1Result[]
    } catch (error) {
      restoreStoreState(this.store, snapshot)
      throw error
    }
  }
}

export type MockBindings = Bindings & {
  __testStore: Store
}

export function createMockEnv(overrides: Partial<Bindings> = {}): MockBindings {
  const kv = new Map<string, string>()
  const store: Store = {
    metadata: new Map([['schema_version', '0']]),
    kvPutOptions: new Map(),
    categories: [],
    items: [],
    endpoints: [],
    tags: [],
    itemTags: [],
    authUsers: [],
    authSessions: [],
    authSessionTouchCount: 0,
    failNextNavCacheVersionIncrement: false,
  }

  return {
    AUTH_MODE: 'development',
    APP_VERSION: '0.1.0-test',
    SETUP_TOKEN: 'setup-secret',
    ASSETS: {
      fetch: (request: Request) => {
        const url = new URL(request.url)

        if (url.pathname === '/' || url.pathname === '/index.html') {
          return Promise.resolve(
            new Response('<!doctype html><div id="app"></div>', {
              headers: { 'content-type': 'text/html' },
            }),
          )
        }

        return Promise.resolve(new Response('Not found', { status: 404 }))
      },
    } as Fetcher,
    DB: new MockDb(store) as unknown as D1Database,
    KV: {
      put: (key: string, value: string, options?: KVNamespacePutOptions) => {
        kv.set(key, value)
        if (options) {
          store.kvPutOptions.set(key, options)
        }
        return Promise.resolve()
      },
      get: (key: string) => Promise.resolve(kv.get(key) ?? null),
    } as unknown as KVNamespace,
    __testStore: store,
    ...overrides,
  }
}
