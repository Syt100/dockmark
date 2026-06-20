import { getStartupMetadata } from './extension.js'

const startupMetadata = getStartupMetadata()

globalThis.console.info(`${startupMetadata.name} extension ${startupMetadata.version} loaded`)
