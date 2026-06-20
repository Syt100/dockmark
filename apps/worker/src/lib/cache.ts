import type { NavResponse } from '@dockmark/shared'

const NAV_VERSION_KEY = 'cache_version:nav'
const NAV_CACHE_VERSION_BASELINE = 2
const NAV_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7

export async function getNavCacheVersion(db: D1Database): Promise<number> {
  const row = await db.prepare('SELECT value FROM app_metadata WHERE key = ?').bind(NAV_VERSION_KEY).first<{ value: string }>()
  const value = row?.value
  const version = value ? Number.parseInt(value, 10) : NAV_CACHE_VERSION_BASELINE
  return Number.isFinite(version) && version >= NAV_CACHE_VERSION_BASELINE ? version : NAV_CACHE_VERSION_BASELINE
}

export async function incrementNavCacheVersion(db: D1Database): Promise<void> {
  await navCacheVersionIncrementStatement(db).run()
}

export function navCacheVersionIncrementStatement(db: D1Database): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO app_metadata (key, value, updated_at)
       VALUES (?, '3', CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(NAV_VERSION_KEY)
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
  await kv.put(`nav:home:v${version}`, JSON.stringify(payload), {
    expirationTtl: NAV_CACHE_TTL_SECONDS,
  })
}
