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
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  hidden: 'border-amber-200 bg-amber-50 text-amber-700',
  archived: 'border-slate-200 bg-slate-100 text-slate-600',
}
