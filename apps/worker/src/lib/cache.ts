import type { NavResponse } from '@dockmark/shared'

const NAV_VERSION_KEY = 'cache_version:nav'

export async function getNavCacheVersion(kv: KVNamespace): Promise<number> {
  const value = await kv.get(NAV_VERSION_KEY)
  const version = value ? Number.parseInt(value, 10) : 1
  return Number.isFinite(version) && version > 0 ? version : 1
}

export async function incrementNavCacheVersion(kv: KVNamespace): Promise<number> {
  const next = (await getNavCacheVersion(kv)) + 1
  await kv.put(NAV_VERSION_KEY, String(next))
  return next
}

export async function getCachedNavigation(kv: KVNamespace): Promise<NavResponse | null> {
  const version = await getNavCacheVersion(kv)
  const value = await kv.get(`nav:home:v${version}`)

  if (!value) {
    return null
  }

  return JSON.parse(value) as NavResponse
}

export async function putCachedNavigation(kv: KVNamespace, payload: NavResponse): Promise<void> {
  const version = await getNavCacheVersion(kv)
  await kv.put(`nav:home:v${version}`, JSON.stringify(payload))
}

