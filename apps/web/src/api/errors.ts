import { ApiError } from './client'

const knownErrorCodes = {
  auth_invalid_credentials: '邮箱或密码不正确。',
  auth_setup_exists: '管理员已经初始化，请直接登录。',
  auth_setup_token_invalid: '初始化令牌不正确。',
  authentication_required: '请先登录。',
  config_error: '服务端配置不完整或当前模式不可用。',
  conflict: '数据已存在或与现有记录冲突。',
  invalid_json: '请求内容不是有效的 JSON。',
  not_found: '请求的数据不存在。',
  validation_failed: '请求内容未通过校验。',
} as const

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
  if (caught instanceof ApiError && caught.code && caught.code in knownErrorCodes) {
    return knownErrorCodes[caught.code as keyof typeof knownErrorCodes]
  }

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
