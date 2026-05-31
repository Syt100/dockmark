export interface BuildInfo {
  buildTime: string
  commitShort: string
  version: string
}

export const buildInfo: BuildInfo = {
  buildTime: __BUILD_TIME__,
  commitShort: __GIT_COMMIT_SHORT__,
  version: __APP_VERSION__,
}

export function formatBuildTime(
  buildTime: string,
  locales?: Intl.LocalesArgument,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = new Date(buildTime)

  if (Number.isNaN(date.getTime())) {
    return 'unknown'
  }

  return new Intl.DateTimeFormat(locales, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    ...options,
  }).format(date)
}
