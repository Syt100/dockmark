import { extensionHostPermissions, extensionIdentity, extensionPermissions } from './extension.js'

export type ExtensionManifest = {
  manifest_version: 3
  name: string
  description: string
  version: string
  background: {
    service_worker: string
    type: 'module'
  }
  permissions: string[]
  host_permissions: string[]
}

export const manifest: ExtensionManifest = {
  manifest_version: 3,
  name: extensionIdentity.name,
  description: extensionIdentity.description,
  version: extensionIdentity.version,
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  permissions: extensionPermissions,
  host_permissions: extensionHostPermissions,
}
