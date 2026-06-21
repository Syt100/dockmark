import {
  endpointKinds,
  iconTypes,
  itemStatuses,
  type EndpointKind,
  type IconType,
  type ItemStatus,
  type ValidationResult,
} from './navigation'

export const dockmarkExportSchemaVersion = 1
export const dockmarkExportFormat = 'dockmark-navigation-export'
export const dockmarkExportSource = 'dockmark'
export const importModes = ['additive', 'additiveSkipConflicts', 'replaceAll'] as const
export const importLimits = {
  maxJsonBytes: 1024 * 1024,
  maxCategories: 500,
  maxTags: 1000,
  maxItems: 2000,
  maxEndpoints: 8000,
} as const

export type DockmarkImportMode = (typeof importModes)[number]

export type ExportCategory = {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ExportTag = {
  id: string
  name: string
  slug: string
  createdAt: string
}

export type ExportEndpoint = {
  id: string
  label: string
  url: string
  kind: EndpointKind
  isPrimary: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ExportItem = {
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
  endpoints: ExportEndpoint[]
  tagIds: string[]
}

export type DockmarkExportDocument = {
  format: typeof dockmarkExportFormat
  source: typeof dockmarkExportSource
  appVersion: string
  schemaVersion: typeof dockmarkExportSchemaVersion
  generatedAt: string
  categories: ExportCategory[]
  tags: ExportTag[]
  items: ExportItem[]
}

export type ImportSummary = {
  categories: number
  tags: number
  items: number
  endpoints: number
}

export type ImportPreviewResponse = {
  ok: boolean
  mode: DockmarkImportMode
  summary: ImportSummary
  importable?: ImportSummary
  skipped?: ImportSummary
  currentSummary?: ImportSummary
  details?: ImportPlanDetails
  issues: ImportIssue[]
  errors: string[]
}

export type ImportResultResponse = {
  imported: ImportSummary
  details?: ImportPlanDetails
}

export type ImportRequest = {
  mode: DockmarkImportMode
  document: DockmarkExportDocument
}

export type ImportLimitCheckInput = {
  byteLength?: number
  summary: ImportSummary
}

export type ImportIssueSeverity = 'error' | 'warning'
export type ImportIssueKind = 'validation' | 'conflict' | 'limit' | 'skip' | 'secret'
export type ImportIssueEntityType = 'document' | 'category' | 'tag' | 'item' | 'endpoint'

export type ImportIssue = {
  severity: ImportIssueSeverity
  kind: ImportIssueKind
  entityType: ImportIssueEntityType
  entityId?: string
  entityName?: string
  field?: string
  value?: string
  message: string
}

export type ImportRecordDetail = {
  id: string
  name: string
  reason?: string
}

export type ImportPlanDetails = {
  importable: {
    categories: ImportRecordDetail[]
    tags: ImportRecordDetail[]
    items: ImportRecordDetail[]
  }
  skipped: {
    categories: ImportRecordDetail[]
    tags: ImportRecordDetail[]
    items: ImportRecordDetail[]
  }
}

const forbiddenExportFields = [
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function enumValue<T extends readonly string[]>(value: unknown, allowed: T): value is T[number] {
  return typeof value === 'string' && allowed.includes(value)
}

function hasForbiddenFields(value: Record<string, unknown>, path: string, errors: string[]) {
  for (const field of forbiddenExportFields) {
    if (field in value) {
      errors.push(`${path}.${field} must not be stored in Dockmark exports`)
    }
  }
}

function requireString(
  value: unknown,
  path: string,
  errors: string[],
  options: { allowEmpty?: boolean } = {},
): string {
  if (!isString(value) || (!options.allowEmpty && value.trim().length === 0)) {
    errors.push(`${path} is required`)
    return ''
  }

  return value.trim()
}

function requireNullableString(value: unknown, path: string, errors: string[]): string | null {
  if (!isNullableString(value)) {
    errors.push(`${path} must be a string or null`)
    return null
  }

  return typeof value === 'string' ? value.trim() : null
}

function requireInteger(value: unknown, path: string, errors: string[]): number {
  if (!isInteger(value)) {
    errors.push(`${path} must be an integer`)
    return 0
  }

  return value
}

function requireTimestamp(value: unknown, path: string, errors: string[]): string {
  const timestamp = requireString(value, path, errors)

  if (timestamp && Number.isNaN(Date.parse(timestamp))) {
    errors.push(`${path} must be a valid timestamp`)
  }

  return timestamp
}

function parseCategory(value: unknown, index: number, errors: string[]): ExportCategory {
  const path = `categories.${index}`

  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return emptyCategory()
  }

  hasForbiddenFields(value, path, errors)

  return {
    id: requireString(value.id, `${path}.id`, errors),
    name: requireString(value.name, `${path}.name`, errors),
    slug: requireString(value.slug, `${path}.slug`, errors),
    icon: requireNullableString(value.icon, `${path}.icon`, errors),
    color: requireNullableString(value.color, `${path}.color`, errors),
    sortOrder: requireInteger(value.sortOrder, `${path}.sortOrder`, errors),
    createdAt: requireTimestamp(value.createdAt, `${path}.createdAt`, errors),
    updatedAt: requireTimestamp(value.updatedAt, `${path}.updatedAt`, errors),
  }
}

function parseTag(value: unknown, index: number, errors: string[]): ExportTag {
  const path = `tags.${index}`

  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return emptyTag()
  }

  hasForbiddenFields(value, path, errors)

  return {
    id: requireString(value.id, `${path}.id`, errors),
    name: requireString(value.name, `${path}.name`, errors),
    slug: requireString(value.slug, `${path}.slug`, errors),
    createdAt: requireTimestamp(value.createdAt, `${path}.createdAt`, errors),
  }
}

function parseEndpoint(value: unknown, itemIndex: number, index: number, errors: string[]) {
  const path = `items.${itemIndex}.endpoints.${index}`

  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return emptyEndpoint()
  }

  hasForbiddenFields(value, path, errors)

  const kind = enumValue(value.kind, endpointKinds) ? value.kind : 'public'

  if (!enumValue(value.kind, endpointKinds)) {
    errors.push(`${path}.kind must be one of: ${endpointKinds.join(', ')}`)
  }

  const url = requireString(value.url, `${path}.url`, errors)

  if (url && !isValidUrl(url)) {
    errors.push(`${path}.url must be a valid URL`)
  }

  if (typeof value.isPrimary !== 'boolean') {
    errors.push(`${path}.isPrimary must be a boolean`)
  }

  return {
    id: requireString(value.id, `${path}.id`, errors),
    label: requireString(value.label, `${path}.label`, errors),
    url,
    kind,
    isPrimary: value.isPrimary === true,
    sortOrder: requireInteger(value.sortOrder, `${path}.sortOrder`, errors),
    createdAt: requireTimestamp(value.createdAt, `${path}.createdAt`, errors),
    updatedAt: requireTimestamp(value.updatedAt, `${path}.updatedAt`, errors),
  }
}

function parseItem(value: unknown, index: number, errors: string[]): ExportItem {
  const path = `items.${index}`

  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return emptyItem()
  }

  hasForbiddenFields(value, path, errors)

  const endpoints = Array.isArray(value.endpoints)
    ? value.endpoints.map((endpoint, endpointIndex) =>
        parseEndpoint(endpoint, index, endpointIndex, errors),
      )
    : []

  if (!Array.isArray(value.endpoints)) {
    errors.push(`${path}.endpoints must be an array`)
  }

  if (endpoints.length === 0) {
    errors.push(`${path}.endpoints must include at least one endpoint`)
  }

  if (endpoints.filter((endpoint) => endpoint.isPrimary).length !== 1) {
    errors.push(`${path}.endpoints must include exactly one primary endpoint`)
  }

  if (!Array.isArray(value.tagIds)) {
    errors.push(`${path}.tagIds must be an array`)
  }

  const iconType = enumValue(value.iconType, iconTypes) ? value.iconType : 'emoji'
  const status = enumValue(value.status, itemStatuses) ? value.status : 'active'
  const icon = requireNullableString(value.icon, `${path}.icon`, errors)

  if (!enumValue(value.iconType, iconTypes)) {
    errors.push(`${path}.iconType must be one of: ${iconTypes.join(', ')}`)
  }

  if (!enumValue(value.status, itemStatuses)) {
    errors.push(`${path}.status must be one of: ${itemStatuses.join(', ')}`)
  }

  if (iconType === 'url') {
    if (!icon) {
      errors.push(`${path}.icon is required when iconType is url`)
    } else if (!isValidUrl(icon)) {
      errors.push(`${path}.icon must be a valid URL when iconType is url`)
    }
  }

  return {
    id: requireString(value.id, `${path}.id`, errors),
    categoryId: requireNullableString(value.categoryId, `${path}.categoryId`, errors),
    name: requireString(value.name, `${path}.name`, errors),
    description: requireNullableString(value.description, `${path}.description`, errors),
    icon,
    iconType,
    credentialHint: requireNullableString(value.credentialHint, `${path}.credentialHint`, errors),
    note: requireNullableString(value.note, `${path}.note`, errors),
    status,
    sortOrder: requireInteger(value.sortOrder, `${path}.sortOrder`, errors),
    createdAt: requireTimestamp(value.createdAt, `${path}.createdAt`, errors),
    updatedAt: requireTimestamp(value.updatedAt, `${path}.updatedAt`, errors),
    endpoints,
    tagIds: Array.isArray(value.tagIds)
      ? value.tagIds.filter((tagId): tagId is string => typeof tagId === 'string')
      : [],
  }
}

function emptyCategory(): ExportCategory {
  return {
    id: '',
    name: '',
    slug: '',
    icon: null,
    color: null,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  }
}

function emptyTag(): ExportTag {
  return {
    id: '',
    name: '',
    slug: '',
    createdAt: '',
  }
}

function emptyEndpoint(): ExportEndpoint {
  return {
    id: '',
    label: '',
    url: '',
    kind: 'public',
    isPrimary: false,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  }
}

function emptyItem(): ExportItem {
  return {
    id: '',
    categoryId: null,
    name: '',
    description: null,
    icon: null,
    iconType: 'emoji',
    credentialHint: null,
    note: null,
    status: 'active',
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
    endpoints: [],
    tagIds: [],
  }
}

function validateUnique(values: string[], label: string, errors: string[]) {
  const seen = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`${label} must be unique: ${value}`)
    }

    seen.add(value)
  }
}

function validateReferences(document: DockmarkExportDocument, errors: string[]) {
  const categoryIds = new Set(document.categories.map((category) => category.id))
  const tagIds = new Set(document.tags.map((tag) => tag.id))

  for (const item of document.items) {
    if (item.categoryId && !categoryIds.has(item.categoryId)) {
      errors.push(`items.${item.id}.categoryId references a missing category`)
    }

    for (const tagId of item.tagIds) {
      if (!tagIds.has(tagId)) {
        errors.push(`items.${item.id}.tagIds references a missing tag: ${tagId}`)
      }
    }
  }
}

export function summarizeImportDocument(document: DockmarkExportDocument): ImportSummary {
  return {
    categories: document.categories.length,
    tags: document.tags.length,
    items: document.items.length,
    endpoints: document.items.reduce((count, item) => count + item.endpoints.length, 0),
  }
}

export function estimateJsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength
}

export function validateImportLimits(input: ImportLimitCheckInput): string[] {
  const errors: string[] = []

  if (input.byteLength !== undefined && input.byteLength > importLimits.maxJsonBytes) {
    errors.push(`document size must be at most ${importLimits.maxJsonBytes} bytes`)
  }

  if (input.summary.categories > importLimits.maxCategories) {
    errors.push(`categories must be at most ${importLimits.maxCategories}`)
  }

  if (input.summary.tags > importLimits.maxTags) {
    errors.push(`tags must be at most ${importLimits.maxTags}`)
  }

  if (input.summary.items > importLimits.maxItems) {
    errors.push(`items must be at most ${importLimits.maxItems}`)
  }

  if (input.summary.endpoints > importLimits.maxEndpoints) {
    errors.push(`endpoints must be at most ${importLimits.maxEndpoints}`)
  }

  return errors
}

export function issuesFromMessages(
  messages: string[],
  kind: Extract<ImportIssueKind, 'validation' | 'limit'>,
): ImportIssue[] {
  return messages.map((message) => ({
    severity: 'error',
    kind,
    entityType: 'document',
    message,
  }))
}

export function validateImportMode(input: unknown): ValidationResult<DockmarkImportMode> {
  if (enumValue(input, importModes)) {
    return { ok: true, value: input }
  }

  return { ok: false, errors: [`mode must be one of: ${importModes.join(', ')}`] }
}

export function validateDockmarkExportDocument(
  input: unknown,
): ValidationResult<DockmarkExportDocument> {
  const errors: string[] = []

  if (!isRecord(input)) {
    return { ok: false, errors: ['document must be an object'] }
  }

  hasForbiddenFields(input, 'document', errors)

  if (input.format !== dockmarkExportFormat) {
    errors.push(`format must be ${dockmarkExportFormat}`)
  }

  if (input.source !== dockmarkExportSource) {
    errors.push(`source must be ${dockmarkExportSource}`)
  }

  requireString(input.appVersion, 'appVersion', errors)

  if (input.schemaVersion !== dockmarkExportSchemaVersion) {
    errors.push(`schemaVersion must be ${dockmarkExportSchemaVersion}`)
  }

  const generatedAt = requireTimestamp(input.generatedAt, 'generatedAt', errors)

  if (!Array.isArray(input.categories)) {
    errors.push('categories must be an array')
  }

  if (!Array.isArray(input.tags)) {
    errors.push('tags must be an array')
  }

  if (!Array.isArray(input.items)) {
    errors.push('items must be an array')
  }

  const document: DockmarkExportDocument = {
    format: dockmarkExportFormat,
    source: dockmarkExportSource,
    appVersion: typeof input.appVersion === 'string' ? input.appVersion.trim() : '',
    schemaVersion: dockmarkExportSchemaVersion,
    generatedAt,
    categories: Array.isArray(input.categories)
      ? input.categories.map((category, index) => parseCategory(category, index, errors))
      : [],
    tags: Array.isArray(input.tags)
      ? input.tags.map((tag, index) => parseTag(tag, index, errors))
      : [],
    items: Array.isArray(input.items)
      ? input.items.map((item, index) => parseItem(item, index, errors))
      : [],
  }

  validateUnique(
    [
      ...document.categories.map((category) => category.id),
      ...document.tags.map((tag) => tag.id),
      ...document.items.map((item) => item.id),
      ...document.items.flatMap((item) => item.endpoints.map((endpoint) => endpoint.id)),
    ],
    'record IDs',
    errors,
  )
  validateUnique(
    document.categories.map((category) => category.slug),
    'category slugs',
    errors,
  )
  validateUnique(
    document.tags.map((tag) => tag.name.toLowerCase()),
    'tag names',
    errors,
  )
  validateUnique(
    document.tags.map((tag) => tag.slug),
    'tag slugs',
    errors,
  )
  validateReferences(document, errors)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, value: document }
}
