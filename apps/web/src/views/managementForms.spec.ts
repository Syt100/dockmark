import { describe, expect, it } from 'vitest'

import {
  categoryFormToInput,
  categoryToForm,
  serviceFormToInput,
  serviceToForm,
  tagFormToInput,
  tagToForm,
} from './managementForms'

describe('management form mapping', () => {
  it('maps category nullable fields and numeric sort order consistently', () => {
    const form = categoryToForm({
      id: 'cat_media',
      name: 'Media',
      slug: 'media',
      icon: null,
      color: null,
      sortOrder: 5,
      createdAt: '2026-05-29T00:00:00.000Z',
      updatedAt: '2026-05-29T00:00:00.000Z',
    })

    expect(form).toMatchObject({
      icon: '',
      color: '',
      sortOrder: 5,
    })
    expect(typeof form.sortOrder).toBe('number')
    expect(categoryFormToInput(form)).toMatchObject({
      icon: null,
      color: null,
      sortOrder: 5,
    })
  })

  it('maps tag empty slug to omitted input', () => {
    const form = tagToForm({
      id: 'tag_media',
      name: 'Media',
      slug: 'media',
      createdAt: '2026-05-29T00:00:00.000Z',
    })
    form.slug = ''

    expect(tagFormToInput(form)).toEqual({
      name: 'Media',
      slug: undefined,
    })
  })

  it('maps service nullable fields, endpoint order, and selected tags', () => {
    const form = serviceToForm({
      id: 'item_immich',
      categoryId: null,
      name: 'Immich',
      description: null,
      icon: 'https://cdn.example.test/immich.png',
      iconType: 'url',
      credentialHint: null,
      note: null,
      status: 'active',
      sortOrder: 2,
      createdAt: '2026-05-29T00:00:00.000Z',
      updatedAt: '2026-05-29T00:00:00.000Z',
      tags: [
        { id: 'tag_photo', name: 'Photos', slug: 'photos', createdAt: '2026-05-29T00:00:00.000Z' },
      ],
      endpoints: [
        {
          id: 'endpoint_lan',
          itemId: 'item_immich',
          label: 'LAN',
          url: 'http://immich.local',
          kind: 'lan',
          isPrimary: false,
          sortOrder: 4,
          createdAt: '2026-05-29T00:00:00.000Z',
          updatedAt: '2026-05-29T00:00:00.000Z',
        },
      ],
    })

    expect(form.categoryId).toBe('')
    expect(form.description).toBe('')
    expect(form.icon).toBe('https://cdn.example.test/immich.png')
    expect(form.iconType).toBe('url')
    expect(form.endpoints[0]?.sortOrder).toBe(4)

    form.endpoints.push({
      label: 'Public',
      url: 'https://photos.example.com',
      kind: 'public',
      isPrimary: true,
      sortOrder: 99,
    })

    expect(serviceFormToInput(form, ['tag_photo'])).toMatchObject({
      categoryId: null,
      description: null,
      icon: 'https://cdn.example.test/immich.png',
      iconType: 'url',
      credentialHint: null,
      note: null,
      endpoints: [
        { label: 'LAN', sortOrder: 0 },
        { label: 'Public', sortOrder: 1 },
      ],
      tagIds: ['tag_photo'],
    })
  })
})
