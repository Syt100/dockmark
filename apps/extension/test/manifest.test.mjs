import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getStartupMetadata } from '../dist/extension.js'
import { manifest } from '../dist/manifest.js'

test('defines a Dockmark Manifest V3 background extension', () => {
  assert.equal(manifest.manifest_version, 3)
  assert.equal(manifest.name, 'Dockmark')
  assert.deepEqual(manifest.background, {
    service_worker: 'background.js',
    type: 'module',
  })
})

test('does not request host or bookmark permissions before sync is implemented', () => {
  assert.deepEqual(manifest.host_permissions, [])
  assert.ok(!manifest.permissions.includes('bookmarks'))
})

test('starts with sync behavior disabled', () => {
  assert.deepEqual(getStartupMetadata(), {
    name: 'Dockmark',
    version: '0.1.0',
    syncEnabled: false,
  })
})
