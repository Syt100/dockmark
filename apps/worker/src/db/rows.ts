import type { Category, Endpoint, IconType, ItemStatus, ServiceItem, Tag } from '@dockmark/shared'

export type CategoryRow = {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type TagRow = {
  id: string
  name: string
  slug: string
  created_at: string
}

export type EndpointRow = {
  id: string
  item_id: string
  label: string
  url: string
  kind: Endpoint['kind']
  is_primary: number
  sort_order: number
  created_at: string
  updated_at: string
}

export type ItemRow = {
  id: string
  category_id: string | null
  name: string
  description: string | null
  icon: string | null
  icon_type: IconType
  credential_hint: string | null
  note: string | null
  status: ItemStatus
  sort_order: number
  created_at: string
  updated_at: string
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
  }
}

export function mapEndpoint(row: EndpointRow): Endpoint {
  return {
    id: row.id,
    itemId: row.item_id,
    label: row.label,
    url: row.url,
    kind: row.kind,
    isPrimary: row.is_primary === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapServiceItem(row: ItemRow, endpoints: Endpoint[], tags: Tag[]): ServiceItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    iconType: row.icon_type,
    credentialHint: row.credential_hint,
    note: row.note,
    status: row.status,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    endpoints,
    tags,
  }
}

