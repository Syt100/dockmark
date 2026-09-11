import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ServiceIcon from './ServiceIcon.vue'

describe('ServiceIcon', () => {
  it('renders direct image URL icons', () => {
    const wrapper = mount(ServiceIcon, {
      props: {
        name: 'Immich',
        icon: 'https://cdn.example.test/immich.png',
        iconType: 'url',
      },
    })

    const image = wrapper.find('img')

    expect(image.exists()).toBe(true)
    expect(image.attributes('src')).toBe('https://cdn.example.test/immich.png')
    expect(wrapper.text()).toBe('')
  })

  it('derives favicon icons from the primary endpoint origin', () => {
    const wrapper = mount(ServiceIcon, {
      props: {
        name: 'Grafana',
        icon: null,
        iconType: 'favicon',
        primaryUrl: 'https://grafana.example.test/dashboards/home',
      },
    })

    expect(wrapper.find('img').attributes('src')).toBe('https://grafana.example.test/favicon.ico')
  })

  it('renders managed R2 icons through the authenticated asset route', () => {
    const key = `icons/sha256/${'a'.repeat(64)}.png`
    const wrapper = mount(ServiceIcon, {
      props: {
        name: 'Immich',
        icon: key,
        iconType: 'r2',
      },
    })

    expect(wrapper.get('img').attributes('src')).toBe(`/api/icon-assets/${key}`)
  })

  it('falls back to generated initials when an image fails to load', async () => {
    const wrapper = mount(ServiceIcon, {
      props: {
        name: 'Uptime Kuma',
        icon: 'https://status.example.test/icon.png',
        iconType: 'url',
      },
    })

    await wrapper.find('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('UK')
  })

  it('falls back when favicon mode has no valid primary endpoint', () => {
    const wrapper = mount(ServiceIcon, {
      props: {
        name: 'Paperless-ngx',
        icon: null,
        iconType: 'favicon',
        primaryUrl: 'not a url',
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('PN')
  })

  it('falls back when an R2 icon key is not content-addressed', () => {
    const wrapper = mount(ServiceIcon, {
      props: {
        name: 'Home Assistant',
        icon: 'icons/not-managed.png',
        iconType: 'r2',
      },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('HA')
  })
})
