import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ImportExportView from './ImportExportView.vue'

const timestamp = '2026-06-21T00:00:00.000Z'

function createFile(contents: string) {
  return {
    name: 'dockmark.json',
    text: () => Promise.resolve(contents),
  } as File
}

function jsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

describe('ImportExportView', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('downloads an export document', async () => {
    const click = vi.fn<() => void>()
    const revokeObjectURL = vi.fn<(url: string) => void>()
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:export')
    const createElement = document.createElement.bind(document)
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      jsonResponse({
        schemaVersion: 1,
        generatedAt: timestamp,
        categories: [],
        tags: [],
        items: [],
      }),
    )

    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click,
        } as unknown as HTMLAnchorElement
      }

      return createElement(tagName)
    })

    const wrapper = mount(ImportExportView)

    await wrapper.find('button').trigger('click')

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/import-export/export',
        expect.objectContaining({
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      )
      expect(click).toHaveBeenCalled()
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:export')
      expect(wrapper.text()).toContain('导出文件已准备下载')
    })
  })

  it('shows preview validation errors without enabling import', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      jsonResponse({
        ok: false,
        mode: 'additive',
        summary: { categories: 0, tags: 0, items: 0, endpoints: 0 },
        errors: ['schemaVersion must be 1'],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ImportExportView)
    const input = wrapper.find('input[type="file"]')

    Object.defineProperty(input.element, 'files', {
      value: [createFile('{"schemaVersion":999}')],
      configurable: true,
    })
    await input.trigger('change')

    await wrapper.findAll('button')[1]!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('预检未通过')
      expect(wrapper.text()).toContain('schemaVersion must be 1')
    })
    expect(wrapper.findAll('button')[2]!.attributes('disabled')).toBeDefined()
  })

  it('requires explicit confirmation for replace-all imports', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
      jsonResponse({
        ok: true,
        mode: 'replaceAll',
        summary: { categories: 1, tags: 1, items: 1, endpoints: 1 },
        errors: [],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ImportExportView)
    await wrapper.find('select').setValue('replaceAll')

    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [createFile('{"schemaVersion":1}')],
      configurable: true,
    })
    await input.trigger('change')
    await wrapper.findAll('button')[1]!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('预检通过')
    })

    const importButton = wrapper.findAll('button')[2]!
    expect(importButton.attributes('disabled')).toBeDefined()

    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(wrapper.findAll('button')[2]!.attributes('disabled')).toBeUndefined()
  })

  it('imports after a successful preview and shows feedback', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementationOnce(() =>
        jsonResponse({
          ok: true,
          mode: 'additive',
          summary: { categories: 1, tags: 1, items: 1, endpoints: 2 },
          errors: [],
        }),
      )
      .mockImplementationOnce(() =>
        jsonResponse({
          imported: { categories: 1, tags: 1, items: 1, endpoints: 2 },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mount(ImportExportView)
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [createFile('{"schemaVersion":1}')],
      configurable: true,
    })
    await input.trigger('change')
    await wrapper.findAll('button')[1]!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('预检通过')
    })

    await wrapper.findAll('button')[2]!.trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('导入完成：1 个服务，2 个地址')
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/import-export/import',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
})
