import type { NavResponse } from '@dockmark/shared'

const NAV_VERSION_KEY = 'cache_version:nav'

export async function getNavCacheVersion(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT value FROM app_metadata WHERE key = ?').bind(NAV_VERSION_KEY).first<{ value: string }>()
  const value = row?.value
  const version = value ? Number.parseInt(value, 10) : 1
  return Number.isFinite(version) && version > 0 ? version : 1
}

export async function incrementNavCacheVersion(db: D1Database): Promise<void> {
  await db
    .prepare(
      `INSERT INTO app_metadata (key, value, updated_at)
       VALUES (?, '2', CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(NAV_VERSION_KEY)
    .run()
}

export async function getCachedNavigation(db: D1Database, kv: KVNamespace): Promise<NavResponse | null> {
  const version = await getNavCacheVersion(db)
  const value = await kv.get(`nav:home:v${version}`)

  if (!value) {
    return null
  }

  return JSON.parse(value) as NavResponse
}

export async function putCachedNavigation(db: D1Database, kv: KVNamespace, payload: NavResponse): Promise<void> {
  const version = await getNavCacheVersion(db)
  await kv.put(`nav:home:v${version}`, JSON.stringify(payload))
}
