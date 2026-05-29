const knownErrorMessages: Array<[string, string]> = [
  ['exactly one endpoint must be primary', '每个服务必须且只能设置一个主地址。'],
  ['url must be a valid URL', '请输入完整有效的 URL，例如 https://example.com。'],
  ['name is required', '请填写名称。'],
  ['body must be an object', '请求内容格式不正确。'],
  ['Request body must be valid JSON', '请求内容不是有效的 JSON。'],
  ['UNIQUE constraint failed: categories.slug', '分类 Slug 已存在，请换一个。'],
  ['UNIQUE constraint failed: tags.slug', '标签 Slug 已存在，请换一个。'],
  ['UNIQUE constraint failed: tags.name', '标签名称已存在。'],
]

export function toChineseError(caught: unknown, fallback: string): string {
  const message = caught instanceof Error ? caught.message : ''

  if (!message) {
    return fallback
  }

  for (const [needle, translated] of knownErrorMessages) {
    if (message.includes(needle)) {
      return translated
    }
  }

  return `${fallback}：${message}`
}
