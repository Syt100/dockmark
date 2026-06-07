-- Local development data for Dockmark.
-- This file intentionally stores only credential lookup hints, never secrets.

BEGIN TRANSACTION;

INSERT OR IGNORE INTO categories (id, name, slug, icon, color, sort_order)
VALUES
  ('cat_seed_infra', '基础设施', 'infrastructure', '🏗️', '#2563eb', 10),
  ('cat_seed_media', '媒体与照片', 'media-photos', '🎞️', '#db2777', 20),
  ('cat_seed_data', '数据与自动化', 'data-automation', '🧰', '#16a34a', 30),
  ('cat_seed_ops', '监控与运维', 'observability-ops', '📟', '#f59e0b', 40);

INSERT OR IGNORE INTO tags (id, name, slug)
VALUES
  ('tag_seed_public', '公网', 'public'),
  ('tag_seed_lan', '内网', 'lan'),
  ('tag_seed_tailscale', 'Tailscale', 'tailscale'),
  ('tag_seed_admin', '管理后台', 'admin'),
  ('tag_seed_backup', '备份', 'backup'),
  ('tag_seed_family', '家庭使用', 'family'),
  ('tag_seed_monitoring', '监控', 'monitoring'),
  ('tag_seed_docs', '文档', 'docs');

INSERT OR IGNORE INTO items (
  id,
  category_id,
  name,
  description,
  icon,
  icon_type,
  credential_hint,
  note,
  status,
  sort_order
)
VALUES
  (
    'item_seed_dockmark',
    'cat_seed_infra',
    'Dockmark',
    'Homelab 服务导航与书签入口。',
    '⚓',
    'emoji',
    'Vaultwarden 搜 Dockmark',
    '本地开发默认使用 development auth adapter。',
    'active',
    10
  ),
  (
    'item_seed_vaultwarden',
    'cat_seed_infra',
    'Vaultwarden',
    '家庭密码库与凭据查询入口。',
    NULL,
    'favicon',
    'Vaultwarden 搜 Vaultwarden Admin',
    'Dockmark 只保存查询提示，不保存任何凭据。',
    'active',
    20
  ),
  (
    'item_seed_adguard',
    'cat_seed_infra',
    'AdGuard Home',
    '局域网 DNS 过滤与 DHCP 面板。',
    '🛡️',
    'emoji',
    'Vaultwarden 搜 AdGuard',
    NULL,
    'active',
    30
  ),
  (
    'item_seed_immich',
    'cat_seed_media',
    'Immich',
    '照片备份、家庭相册与移动端同步。',
    'https://immich.app/img/immich-logo-stacked-light.svg',
    'url',
    'Vaultwarden 搜 Immich',
    '移动端通过公网地址连接，后台管理走内网。',
    'active',
    10
  ),
  (
    'item_seed_jellyfin',
    'cat_seed_media',
    'Jellyfin',
    '家庭影音库与客厅播放服务。',
    '🎬',
    'emoji',
    NULL,
    '电视端优先使用内网地址。',
    'active',
    20
  ),
  (
    'item_seed_paperless',
    'cat_seed_data',
    'Paperless-ngx',
    '文档归档、OCR 与票据检索。',
    '📄',
    'emoji',
    'Vaultwarden 搜 Paperless',
    NULL,
    'active',
    10
  ),
  (
    'item_seed_n8n',
    'cat_seed_data',
    'n8n',
    '自动化工作流、Webhook 与定时任务。',
    '🔁',
    'emoji',
    'Vaultwarden 搜 n8n',
    'Webhook 入口单独放在 API endpoint。',
    'active',
    20
  ),
  (
    'item_seed_uptime',
    'cat_seed_ops',
    'Uptime Kuma',
    '服务可用性监控与通知面板。',
    '📈',
    'emoji',
    'Vaultwarden 搜 Uptime Kuma',
    NULL,
    'active',
    10
  ),
  (
    'item_seed_grafana',
    'cat_seed_ops',
    'Grafana',
    '指标仪表盘、日志视图与告警概览。',
    '📊',
    'emoji',
    'Vaultwarden 搜 Grafana',
    NULL,
    'active',
    20
  ),
  (
    'item_seed_archive_box',
    NULL,
    'ArchiveBox',
    '网页归档与稍后阅读存档。',
    '🗃️',
    'emoji',
    'Vaultwarden 搜 ArchiveBox',
    '未分类样例，用于检查首页 uncategorized 区域。',
    'active',
    900
  ),
  (
    'item_seed_old_wiki',
    'cat_seed_data',
    '旧 Wiki',
    '已迁移的知识库，只保留用于检查隐藏状态。',
    '📚',
    'emoji',
    NULL,
    'hidden 状态不应出现在首页导航。',
    'hidden',
    800
  ),
  (
    'item_seed_retired_dashboard',
    'cat_seed_ops',
    '退役面板',
    '归档状态样例。',
    '🗄️',
    'emoji',
    NULL,
    'archived 状态不应出现在首页导航。',
    'archived',
    810
  );

INSERT OR IGNORE INTO endpoints (id, item_id, label, url, kind, is_primary, sort_order)
VALUES
  ('end_seed_dockmark_local', 'item_seed_dockmark', '本地 Web', 'http://127.0.0.1:8788', 'lan', 1, 10),
  ('end_seed_dockmark_api', 'item_seed_dockmark', '本地 API', 'http://127.0.0.1:8789/api/health', 'api', 0, 20),
  ('end_seed_dockmark_docs', 'item_seed_dockmark', '项目文档', 'http://127.0.0.1:8788/about', 'docs', 0, 30),

  ('end_seed_vaultwarden_public', 'item_seed_vaultwarden', '公网', 'https://vault.example.test', 'public', 1, 10),
  ('end_seed_vaultwarden_lan', 'item_seed_vaultwarden', '内网', 'http://vault.lan', 'lan', 0, 20),
  ('end_seed_vaultwarden_admin', 'item_seed_vaultwarden', 'Admin', 'https://vault.example.test/admin', 'admin', 0, 30),

  ('end_seed_adguard_lan', 'item_seed_adguard', '内网管理', 'http://adguard.lan', 'lan', 1, 10),
  ('end_seed_adguard_tailscale', 'item_seed_adguard', 'Tailscale', 'http://adguard.tailnet.example.ts.net', 'tailscale', 0, 20),

  ('end_seed_immich_public', 'item_seed_immich', '公网', 'https://photos.example.test', 'public', 1, 10),
  ('end_seed_immich_lan', 'item_seed_immich', '内网', 'http://immich.lan', 'lan', 0, 20),
  ('end_seed_immich_admin', 'item_seed_immich', '管理任务', 'http://immich.lan/admin/jobs', 'admin', 0, 30),

  ('end_seed_jellyfin_lan', 'item_seed_jellyfin', '客厅内网', 'http://jellyfin.lan', 'lan', 1, 10),
  ('end_seed_jellyfin_public', 'item_seed_jellyfin', '公网', 'https://stream.example.test', 'public', 0, 20),

  ('end_seed_paperless_lan', 'item_seed_paperless', '内网', 'http://paperless.lan', 'lan', 1, 10),
  ('end_seed_paperless_docs', 'item_seed_paperless', '收件箱说明', 'http://paperless.lan/documents/inbox', 'docs', 0, 20),

  ('end_seed_n8n_lan', 'item_seed_n8n', '编辑器', 'http://n8n.lan', 'lan', 1, 10),
  ('end_seed_n8n_webhook', 'item_seed_n8n', 'Webhook', 'https://hooks.example.test/webhook/dockmark-demo', 'api', 0, 20),

  ('end_seed_uptime_public', 'item_seed_uptime', '状态页', 'https://status.example.test', 'public', 1, 10),
  ('end_seed_uptime_admin', 'item_seed_uptime', '管理后台', 'http://uptime.lan/dashboard', 'admin', 0, 20),

  ('end_seed_grafana_lan', 'item_seed_grafana', '内网', 'http://grafana.lan', 'lan', 1, 10),
  ('end_seed_grafana_tailscale', 'item_seed_grafana', 'Tailscale', 'http://grafana.tailnet.example.ts.net', 'tailscale', 0, 20),

  ('end_seed_archive_box_lan', 'item_seed_archive_box', '内网', 'http://archivebox.lan', 'lan', 1, 10),
  ('end_seed_archive_box_docs', 'item_seed_archive_box', '归档队列', 'http://archivebox.lan/admin/core/snapshot/', 'admin', 0, 20),

  ('end_seed_old_wiki_lan', 'item_seed_old_wiki', '旧地址', 'http://wiki-old.lan', 'lan', 1, 10),
  ('end_seed_retired_dashboard_lan', 'item_seed_retired_dashboard', '归档地址', 'http://retired-dashboard.lan', 'lan', 1, 10);

INSERT OR IGNORE INTO item_tags (item_id, tag_id)
VALUES
  ('item_seed_dockmark', 'tag_seed_lan'),
  ('item_seed_dockmark', 'tag_seed_docs'),
  ('item_seed_dockmark', 'tag_seed_admin'),
  ('item_seed_vaultwarden', 'tag_seed_public'),
  ('item_seed_vaultwarden', 'tag_seed_lan'),
  ('item_seed_vaultwarden', 'tag_seed_admin'),
  ('item_seed_adguard', 'tag_seed_lan'),
  ('item_seed_adguard', 'tag_seed_tailscale'),
  ('item_seed_adguard', 'tag_seed_admin'),
  ('item_seed_immich', 'tag_seed_public'),
  ('item_seed_immich', 'tag_seed_lan'),
  ('item_seed_immich', 'tag_seed_family'),
  ('item_seed_jellyfin', 'tag_seed_lan'),
  ('item_seed_jellyfin', 'tag_seed_family'),
  ('item_seed_paperless', 'tag_seed_lan'),
  ('item_seed_paperless', 'tag_seed_docs'),
  ('item_seed_paperless', 'tag_seed_backup'),
  ('item_seed_n8n', 'tag_seed_lan'),
  ('item_seed_n8n', 'tag_seed_admin'),
  ('item_seed_uptime', 'tag_seed_public'),
  ('item_seed_uptime', 'tag_seed_monitoring'),
  ('item_seed_grafana', 'tag_seed_lan'),
  ('item_seed_grafana', 'tag_seed_tailscale'),
  ('item_seed_grafana', 'tag_seed_monitoring'),
  ('item_seed_archive_box', 'tag_seed_lan'),
  ('item_seed_archive_box', 'tag_seed_docs'),
  ('item_seed_old_wiki', 'tag_seed_docs'),
  ('item_seed_retired_dashboard', 'tag_seed_monitoring');

UPDATE app_metadata
SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT),
    updated_at = CURRENT_TIMESTAMP
WHERE key = 'cache_version:nav';

COMMIT;
