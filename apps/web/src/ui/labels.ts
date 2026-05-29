import type { EndpointKind, ItemStatus } from '@dockmark/shared'

export const endpointKindLabels: Record<EndpointKind, string> = {
  public: '公网',
  lan: '内网',
  tailscale: 'Tailscale',
  admin: '管理后台',
  backup: '备份',
  docs: '文档',
  api: 'API',
}

export const statusLabels: Record<ItemStatus, string> = {
  active: '启用',
  hidden: '隐藏',
  archived: '归档',
}

export const statusToneClasses: Record<ItemStatus, string> = {
  active: 'bg-[var(--dm-success-soft)] text-[var(--dm-success-text)]',
  hidden: 'bg-[var(--dm-warning-soft)] text-[var(--dm-warning-text)]',
  archived: 'bg-[var(--dm-surface-muted)] text-[var(--dm-text-muted)]',
}
