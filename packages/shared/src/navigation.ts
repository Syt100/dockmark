export const endpointKinds = ['public', 'lan', 'tailscale', 'admin', 'backup', 'docs', 'api'] as const
export const itemStatuses = ['active', 'hidden', 'archived'] as const
export const iconTypes = ['emoji', 'url', 'favicon', 'r2', 'simple-icons'] as const

export type EndpointKind = (typeof endpointKinds)[number]
export type ItemStatus = (typeof itemStatuses)[number]
export type IconType = (typeof iconTypes)[number]

export type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type Tag = {
  id: string
  name: string
  slug: string
  createdAt: string
}

export type Endpoint = {
  id: string
  itemId: string
  label: string
  url: string
  kind: EndpointKind
  isPrimary: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ServiceItem = {
  id: string
  categoryId: string | null
  name: string
  description: string | null
  icon: string | null
  iconType: IconType
  credentialHint: string | null
  note: string | null
  status: ItemStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
  endpoints: Endpoint[]
  tags: Tag[]
}

export type NavItem = Omit<ServiceItem, 'endpoints'> & {
  primaryEndpoint: Endpoint
  alternateEndpoints: Endpoint[]
}

export type NavCategory = Category & {
  items: NavItem[]
}

export type NavResponse = {
  categories: NavCategory[]
  uncategorized: NavItem[]
}

export type CategoryResponse = {
  category: Category
}

export type TagResponse = {
  tag: Tag
}

export type CategoryInput = {
  name: string
  slug?: string
  icon?: string | null
  color?: string | null
  sortOrder?: number
}

export type TagInput = {
  name: string
  slug?: string
}

export type EndpointInput = {
  id?: string
  label: string
  url: string
  kind?: EndpointKind
  isPrimary?: boolean
  sortOrder?: number
}

export type ServiceItemInput = {
  categoryId?: string | null
  name: string
  description?: string | null
  icon?: string | null
  iconType?: IconType
  credentialHint?: string | null
  note?: string | null
  status?: ItemStatus
  sortOrder?: number
  endpoints: EndpointInput[]
  tagIds?: string[]
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalString(value: unknown, field: string, errors: string[]): string | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    errors.push(`${field} must be a string`)
    return undefined
  }

  return value.trim()
}

function optionalInteger(value: unknown, field: string, errors: string[]): number | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    errors.push(`${field} must be an integer`)
    return undefined
  }

  return value
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function requiredString(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${field} is required`)
    return ''
  }

  return value.trim()
}

function enumValue<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
  errors: string[],
): T[number] | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === 'string' && allowed.includes(value)) {
    return value as T[number]
  }

  errors.push(`${field} must be one of: ${allowed.join(', ')}`)
  return undefined
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${prefix}_${suffix}`
}

export function validateCategoryInput(input: unknown): ValidationResult<CategoryInput> {
  const errors: string[] = []

  if (!isRecord(input)) {
    return { ok: false, errors: ['body must be an object'] }
  }

  const name = requiredString(input.name, 'name', errors)
  const slug = optionalString(input.slug, 'slug', errors)
  const icon = optionalString(input.icon, 'icon', errors)
  const color = optionalString(input.color, 'color', errors)
  const sortOrder = optionalInteger(input.sortOrder, 'sortOrder', errors)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      name,
      slug: slug || undefined,
      icon: icon ?? null,
      color: color ?? null,
      sortOrder: sortOrder ?? 0,
    },
  }
}

export function validateTagInput(input: unknown): ValidationResult<TagInput> {
  const errors: string[] = []

  if (!isRecord(input)) {
    return { ok: false, errors: ['body must be an object'] }
  }

  const name = requiredString(input.name, 'name', errors)
  const slug = optionalString(input.slug, 'slug', errors)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      name,
      slug: slug || undefined,
    },
  }
}

export function validateServiceItemInput(input: unknown): ValidationResult<ServiceItemInput> {
  const errors: string[] = []
  const forbiddenFields = [
    'username',
    'password',
    'token',
    'apiKey',
    'api_key',
    'otp',
    'otpSeed',
    'otp_seed',
    'sessionCookie',
    'session_cookie',
  ]

  if (!isRecord(input)) {
    return { ok: false, errors: ['body must be an object'] }
  }

  for (const field of forbiddenFields) {
    if (field in input) {
      errors.push(`${field} must not be stored in Dockmark`)
    }
  }

  const name = requiredString(input.name, 'name', errors)
  const categoryId = optionalString(input.categoryId, 'categoryId', errors)
  const description = optionalString(input.description, 'description', errors)
  const icon = optionalString(input.icon, 'icon', errors)
  const iconType = enumValue(input.iconType, iconTypes, 'iconType', errors) ?? 'emoji'
  const credentialHint = optionalString(input.credentialHint, 'credentialHint', errors)
  const note = optionalString(input.note, 'note', errors)
  const status = enumValue(input.status, itemStatuses, 'status', errors) ?? 'active'
  const sortOrder = optionalInteger(input.sortOrder, 'sortOrder', errors) ?? 0

  if (!Array.isArray(input.endpoints)) {
    errors.push('endpoints is required')
  }

  const endpoints = Array.isArray(input.endpoints)
    ? input.endpoints.map((endpoint, index): EndpointInput => {
        if (!isRecord(endpoint)) {
          errors.push(`endpoints.${index} must be an object`)
          return {
            label: '',
            url: '',
          }
        }

        const endpointId = optionalString(endpoint.id, `endpoints.${index}.id`, errors)
        const label = requiredString(endpoint.label, `endpoints.${index}.label`, errors)
        const url = requiredString(endpoint.url, `endpoints.${index}.url`, errors)
        const kind = enumValue(endpoint.kind, endpointKinds, `endpoints.${index}.kind`, errors) ?? 'public'
        const sort = optionalInteger(endpoint.sortOrder, `endpoints.${index}.sortOrder`, errors) ?? index

        if (url && !isValidUrl(url)) {
          errors.push(`endpoints.${index}.url must be a valid URL`)
        }

        return {
          id: endpointId ?? undefined,
          label,
          url,
          kind,
          isPrimary: endpoint.isPrimary === true,
          sortOrder: sort,
        }
      })
    : []

  const primaryCount = endpoints.filter((endpoint) => endpoint.isPrimary).length

  if (endpoints.length === 0) {
    errors.push('at least one endpoint is required')
  }

  if (primaryCount !== 1) {
    errors.push('exactly one endpoint must be primary')
  }

  const tagIds = Array.isArray(input.tagIds)
    ? input.tagIds.filter((tagId): tagId is string => typeof tagId === 'string' && tagId.trim() !== '')
    : []

  if (input.tagIds !== undefined && !Array.isArray(input.tagIds)) {
    errors.push('tagIds must be an array')
  }

  if (iconType === 'url') {
    if (!icon) {
      errors.push('icon is required when iconType is url')
    } else if (!isValidUrl(icon)) {
      errors.push('icon must be a valid URL when iconType is url')
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    value: {
      categoryId: categoryId ?? null,
      name,
      description: description ?? null,
      icon: icon || null,
      iconType,
      credentialHint: credentialHint ?? null,
      note: note ?? null,
      status,
      sortOrder,
      endpoints,
      tagIds,
    },
  }
}

export function buildNavItem(item: ServiceItem): NavItem {
  const primaryEndpoint = item.endpoints.find((endpoint) => endpoint.isPrimary)

  if (!primaryEndpoint) {
    throw new Error(`Service item ${item.id} has no primary endpoint`)
  }

  return {
    ...item,
    primaryEndpoint,
    alternateEndpoints: item.endpoints.filter((endpoint) => endpoint.id !== primaryEndpoint.id),
  }
}
