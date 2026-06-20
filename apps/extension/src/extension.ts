export const extensionIdentity = {
  name: 'Dockmark',
  description: 'Dockmark browser extension foundation.',
  version: '0.1.0',
} as const

export const extensionPermissions: string[] = []

export const extensionHostPermissions: string[] = []

export function getStartupMetadata() {
  return {
    name: extensionIdentity.name,
    version: extensionIdentity.version,
    syncEnabled: false,
  }
}
