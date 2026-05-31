import type {
  Category,
  CategoryInput,
  EndpointKind,
  ServiceItem,
  ServiceItemInput,
  Tag,
  TagInput,
} from '@dockmark/shared'

export type CategoryForm = {
  name: string
  slug: string
  icon: string
  color: string
  sortOrder: number
}

export type TagForm = {
  name: string
  slug: string
}

export type EndpointForm = {
  id?: string
  label: string
  url: string
  kind: EndpointKind
  isPrimary: boolean
  sortOrder: number
}

export type ServiceForm = {
  name: string
  categoryId: string
  description: string
  icon: string
  credentialHint: string
  note: string
  status: ServiceItem['status']
  sortOrder: number
  endpoints: EndpointForm[]
}

export function categoryToForm(category: Category): CategoryForm {
  return {
    name: category.name,
    slug: category.slug,
    icon: category.icon ?? '',
    color: category.color ?? '',
    sortOrder: category.sortOrder,
  }
}

export function categoryFormToInput(form: CategoryForm): CategoryInput {
  return {
    name: form.name,
    slug: form.slug || undefined,
    icon: form.icon || null,
    color: form.color || null,
    sortOrder: form.sortOrder,
  }
}

export function tagToForm(tag: Tag): TagForm {
  return {
    name: tag.name,
    slug: tag.slug,
  }
}

export function tagFormToInput(form: TagForm): TagInput {
  return {
    name: form.name,
    slug: form.slug || undefined,
  }
}

export function serviceToForm(item: ServiceItem): ServiceForm {
  return {
    name: item.name,
    categoryId: item.categoryId ?? '',
    description: item.description ?? '',
    icon: item.icon ?? '',
    credentialHint: item.credentialHint ?? '',
    note: item.note ?? '',
    status: item.status,
    sortOrder: item.sortOrder,
    endpoints: item.endpoints.map((endpoint) => ({
      id: endpoint.id,
      label: endpoint.label,
      url: endpoint.url,
      kind: endpoint.kind,
      isPrimary: endpoint.isPrimary,
      sortOrder: endpoint.sortOrder,
    })),
  }
}

export function serviceFormToInput(form: ServiceForm, selectedTagIds: string[]): ServiceItemInput {
  return {
    name: form.name,
    categoryId: form.categoryId || null,
    description: form.description || null,
    icon: form.icon || null,
    iconType: 'emoji',
    credentialHint: form.credentialHint || null,
    note: form.note || null,
    status: form.status,
    sortOrder: form.sortOrder,
    endpoints: form.endpoints.map((endpoint, index) => ({
      ...endpoint,
      label: endpoint.label,
      url: endpoint.url,
      kind: endpoint.kind,
      isPrimary: endpoint.isPrimary,
      sortOrder: index,
    })),
    tagIds: selectedTagIds,
  }
}
