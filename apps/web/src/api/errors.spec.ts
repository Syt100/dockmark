import { describe, expect, it } from 'vitest'

import { ApiError } from './client'
import { toChineseError } from './errors'

describe('api error localization', () => {
  it('prefers structured error codes', () => {
    expect(
      toChineseError(new ApiError('wording can change', 401, 'authentication_required'), '失败'),
    ).toBe('请先登录。')
  })

  it('maps structured conflict errors', () => {
    expect(
      toChineseError(
        new ApiError('UNIQUE constraint wording can change', 409, 'conflict'),
        '保存失败',
      ),
    ).toBe('数据已存在或与现有记录冲突。')
  })

  it('keeps text fallback for legacy or non-json errors', () => {
    expect(toChineseError(new Error('exactly one endpoint must be primary'), '保存失败')).toBe(
      '每个服务必须且只能设置一个主地址。',
    )
  })
})
