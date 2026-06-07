import { describe, expect, it } from 'vitest'

import {
  buildNavItem,
  slugify,
  validateCategoryInput,
  validateServiceItemInput,
} from './navigation'

describe('navigation validation', () => {
  it('requires exactly one primary endpoint', () => {
    const result = validateServiceItemInput({
      name: 'Immich',
      endpoints: [
        {
          label: 'Public',
          url: 'https://photos.example.com',
          kind: 'public',
        },
        {
          label: 'LAN',
          url: 'http://192.168.1.20:2283',
          kind: 'lan',
        },
      ],
    })

    expect(result).toEqual({
      ok: false,
      errors: ['exactly one endpoint must be primary'],
    })
  })

  it('rejects credential secret fields', () => {
    const result = validateServiceItemInput({
      name: 'Vaultwarden',
      password: 'secret',
      endpoints: [
        {
          label: 'Public',
          url: 'https://vault.example.com',
          kind: 'public',
          isPrimary: true,
        },
      ],
    })

    expect(result).toEqual({
      ok: false,
      errors: ['password must not be stored in Dockmark'],
    })
  })

  it('rejects direct image icons without a valid URL', () => {
    const result = validateServiceItemInput({
      name: 'Grafana',
      icon: 'grafana',
      iconType: 'url',
      endpoints: [
        {
          label: 'Public',
          url: 'https://grafana.example.com',
          kind: 'public',
          isPrimary: true,
        },
      ],
    })

    expect(result).toEqual({
      ok: false,
      errors: ['icon must be a valid URL when iconType is url'],
    })
  })

  it('allows favicon icons without a stored icon value', () => {
    const result = validateServiceItemInput({
      name: 'Grafana',
      icon: '',
      iconType: 'favicon',
      endpoints: [
        {
          label: 'Public',
          url: 'https://grafana.example.com',
          kind: 'public',
          isPrimary: true,
        },
      ],
    })

    expect(result).toMatchObject({
      ok: true,
      value: {
        icon: null,
        iconType: 'favicon',
      },
    })
  })

  it('normalizes optional category input', () => {
    const result = validateCategoryInput({
      name: ' Media ',
      slug: '',
    })

    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Media',
        slug: undefined,
        icon: null,
        color: null,
        sortOrder: 0,
      },
    })
  })

  it('builds a navigation item from an item with endpoints', () => {
    const navItem = buildNavItem({
      id: 'item_1',
      categoryId: null,
      name: 'Vaultwarden',
      description: null,
      icon: null,
      iconType: 'emoji',
      credentialHint: 'Vaultwarden search Vaultwarden',
      note: null,
      status: 'active',
      sortOrder: 0,
      createdAt: '2026-05-29T00:00:00.000Z',
      updatedAt: '2026-05-29T00:00:00.000Z',
      tags: [],
      endpoints: [
        {
          id: 'endpoint_1',
          itemId: 'item_1',
          label: 'Public',
          url: 'https://vault.example.com',
          kind: 'public',
          isPrimary: true,
          sortOrder: 0,
          createdAt: '2026-05-29T00:00:00.000Z',
          updatedAt: '2026-05-29T00:00:00.000Z',
        },
      ],
    })

    expect(navItem.primaryEndpoint.url).toBe('https://vault.example.com')
  })

  it('slugifies names', () => {
    expect(slugify('Media Services')).toBe('media-services')
  })
})
