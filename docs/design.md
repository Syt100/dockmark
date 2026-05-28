# Dockmark 项目方案 v0.1

## 1. 项目名称

**Dockmark**

含义：

```text
Dock + Bookmark
```

它既是一个“自部署服务停靠港”，也是一个“书签索引与同步中心”。

一句话定位：

> **Dockmark 是一个运行在 Cloudflare Serverless 平台上的个人 Homelab 服务导航与浏览器书签同步系统。**

英文 tagline：

> **A serverless dock for your homelab services and browser bookmarks.**

中文 tagline：

> **你的自部署服务与书签停靠站。**

---

# 2. 项目缘由

你现在的实际需求不是普通书签管理，而是：

```text
1. 有很多自部署服务
2. 一部分服务有公网域名
3. 一部分服务只有内网地址
4. 每个服务可能有账号、备注、使用说明
5. 账号密码已经用 Vaultwarden 管理
6. 希望有一个统一入口管理访问
7. 希望未来能自动同步浏览器书签
8. 希望部署成本低，不再维护一台额外服务器
```

现成项目如 Homepage、Homarr、Linkding、Linkwarden、Karakeep 都能解决一部分问题，但它们大多偏 Docker / VPS / 长驻服务。Dockmark 的目标是做一个更轻、更贴合个人 Homelab 的方案：

```text
服务导航优先
书签同步其次
账号只做提示，不保存密码
Cloudflare Worker + D1 + KV 优先
R2 可选
```

核心思想是：

> Dockmark 不是密码管理器，不替代 Vaultwarden；它只负责告诉你“服务在哪里、怎么访问、账号应该去 Vaultwarden 搜什么”。

---

# 3. 项目边界

## 3.1 Dockmark 要做什么

Dockmark 负责：

```text
1. 管理自部署服务入口
2. 管理公网地址、内网地址、备用地址
3. 管理分类、标签、图标、备注
4. 管理 Vaultwarden 搜索提示
5. 管理浏览器同步来的书签
6. 支持把浏览器书签提升为服务入口
7. 支持 JSON 导入导出
8. 支持 Cloudflare Access 保护后台
9. 支持浏览器扩展单向同步书签
```

## 3.2 Dockmark 不做什么

第一阶段不做：

```text
1. 不保存真实密码
2. 不保存 2FA seed
3. 不替代 Vaultwarden
4. 不做复杂网页归档
5. 不做团队协作知识库
6. 不直接访问家庭内网 192.168.x.x 服务做健康检查
7. 不一开始做浏览器双向同步
```

特别是密码相关字段，只允许保存类似：

```text
Vaultwarden 搜 “Jellyfin”
Vaultwarden 搜 “Proxmox root”
Vaultwarden 搜 “Immich admin”
```

而不是保存：

```text
username: xxx
password: xxx
token: xxx
```

---

# 4. 总体架构

Dockmark 推荐使用：

```text
Cloudflare Workers + D1 + KV + Vue 3 + TypeScript
```

R2 作为可选对象存储。你之前说的 “R1” 我这里按 **Cloudflare R2** 理解。

整体结构：

```text
浏览器
  ↓
Vue 3 前端
  ↓
Cloudflare Worker API
  ↓
D1：主数据库
KV：缓存与轻量配置
R2：图标、截图、导入导出文件，可选
Cloudflare Access：整站认证保护
```

Cloudflare 官方目前支持用 Vue 创建并部署到 Workers，前端静态资源可以通过 Workers Assets 托管；Workers 也适合用 TypeScript 开发。([Cloudflare Docs][1])

## 4.1 架构图

```text
┌──────────────────────────────┐
│            Browser            │
│  Vue 3 SPA / Dockmark Web UI  │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│      Cloudflare Access        │
│  登录保护 / 身份验证 / 策略控制 │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│       Cloudflare Worker       │
│  Hono API / Auth / Cache / DB  │
└───────┬─────────┬────────────┘
        │         │
        ▼         ▼
┌────────────┐ ┌──────────────┐
│     D1     │ │      KV      │
│  主数据源   │ │  首页/API缓存 │
└────────────┘ └──────────────┘
        │
        ▼
┌──────────────────────────────┐
│       R2，可选                │
│ 图标 / 截图 / 备份 / 导入文件  │
└──────────────────────────────┘


┌──────────────────────────────┐
│       Browser Extension       │
│  Chrome / Edge / Firefox      │
└───────────────┬──────────────┘
                │
                ▼
        /api/sync/*
                │
                ▼
        Dockmark Worker + D1
```

---

# 5. 技术选型

## 5.1 前端

建议：

```text
Vue 3
TypeScript
Vite
Pinia，可选
Vue Router
Tailwind CSS，可选
Reka UI / Headless UI，可选
```

你提到“无样式组件可选”，这个方向是对的。Dockmark 的 UI 核心不是复杂组件，而是：

```text
搜索
卡片
分类
弹窗
表单
命令面板
树形书签视图
```

所以可以优先用无样式组件保证可访问性，再自己写视觉风格。

前端页面建议：

```text
/
  首页导航

/bookmarks
  浏览器书签

/bookmarks/tree
  文件夹树视图

/services
  服务管理

/services/:id
  服务详情

/categories
  分类管理

/tags
  标签管理

/sync
  浏览器同步设备

/settings
  设置

/import-export
  导入导出
```

---

## 5.2 后端

建议：

```text
Cloudflare Worker
TypeScript
Hono
D1
KV
R2，可选
```

D1 作为主数据库。Cloudflare D1 在 Worker 中推荐使用 prepared statements 和参数绑定，参数绑定可以复用语句并帮助避免 SQL 注入。([Cloudflare Docs][2])

KV 只做缓存，不做主数据源。Workers KV 适合全球低延迟、高读取量场景；但官方也说明 KV 不适合需要原子操作或单事务读写的场景，强一致需求应考虑 Durable Objects。([Cloudflare Docs][3])

R2 只做对象存储。Cloudflare R2 可以通过 Worker binding 在 Worker 内部操作 bucket 与对象。([Cloudflare Docs][4])

---

# 6. 核心设计原则

## 6.1 D1 是唯一真实数据源

所有重要数据都进 D1：

```text
服务
分类
标签
端点
浏览器书签
同步客户端
同步日志
设置
```

KV 中的数据都可以删除并重建。

## 6.2 KV 只做缓存

适合放：

```text
nav:home:v1
bookmarks:recent:v1
settings:public
favicon:metadata:<hash>
```

写入流程：

```text
写 D1
  ↓
删除相关 KV 缓存
  ↓
下次读取时重新生成缓存
```

读取流程：

```text
读 KV
  ↓ miss
读 D1
  ↓
组装响应
  ↓
写回 KV
```

## 6.3 R2 可选

没有 R2 时也能完整运行：

```text
图标：emoji / favicon / 外链
截图：不支持
导入导出：直接下载 JSON
```

有 R2 后增强：

```text
自定义图标
服务截图
书签快照
大型导入文件
自动备份文件
```

## 6.4 密码永不入库

Dockmark 只保存账号提示：

```text
credential_hint: Vaultwarden 搜 "Immich"
```

不保存：

```text
username
password
otp secret
api key
session token
```

---

# 7. 功能模块

## 7.1 服务导航模块

这是 Dockmark 的核心。

一个服务条目包含：

```text
名称
描述
图标
分类
标签
主访问地址
内网地址
备用地址
账号提示
备注
状态
排序
```

示例：

```json
{
  "name": "Immich",
  "description": "家庭照片管理",
  "icon": "📷",
  "category": "Media",
  "primaryUrl": "https://photos.example.com",
  "internalUrl": "http://192.168.1.20:2283",
  "credentialHint": "Vaultwarden 搜 Immich",
  "tags": ["photos", "family", "self-hosted"],
  "status": "active"
}
```

首页展示：

```text
媒体
  Immich
  Jellyfin
  Navidrome

基础设施
  Proxmox
  Grafana
  Uptime Kuma
  Vaultwarden

网络
  OpenWrt
  AdGuard Home
  Tailscale
```

---

## 7.2 多端点设计

一个服务不一定只有一个地址。

例如 Proxmox：

```text
公网地址：https://pve.example.com
内网地址：https://192.168.1.10:8006
Tailscale 地址：https://pve.tailnet.ts.net
备用地址：https://pve-backup.example.com
```

所以建议拆出 `endpoints` 表，而不是只在 `items` 里写一个 URL。

端点类型：

```text
public
lan
tailscale
admin
backup
docs
api
```

---

## 7.3 分类与标签

分类用于首页分组：

```text
Media
Infra
Network
Dev
Family
Docs
Admin
```

标签用于搜索与筛选：

```text
docker
cloudflare
tunnel
internal
public
critical
family
```

分类是“一项服务主要属于哪里”，标签是“这项服务有哪些属性”。

---

## 7.4 浏览器书签模块

Dockmark 的书签系统分两层：

```text
browser_bookmark_nodes：浏览器原始书签树镜像
bookmarks：规范化后的书签库
```

这样可以同时满足：

```text
1. 保留浏览器文件夹结构
2. 支持 URL 去重
3. 支持跨浏览器合并
4. 支持搜索
5. 支持“提升为服务”
```

---

## 7.5 Promote to Service

浏览器同步来的书签不应该自动污染首页导航。

建议提供按钮：

```text
提升为服务
Promote to Service
```

流程：

```text
浏览器书签
  ↓
点击 Promote
  ↓
选择分类
  ↓
填写账号提示、备注、内网地址
  ↓
生成服务条目
```

这样 Dockmark 同时兼顾：

```text
普通书签管理
核心服务导航
```

---

## 7.6 导入导出模块

MVP 支持：

```text
导出全部数据为 JSON
从 JSON 恢复
导入浏览器 bookmarks.html
导入 Dockmark JSON
```

后续支持：

```text
定期自动导出到 R2
保留最近 7 / 30 个备份
加密导出文件
```

---

# 8. 浏览器书签同步设计

## 8.1 为什么需要浏览器扩展

服务端不能直接读取你的 Chrome / Edge / Firefox 云书签。实际可行方案是写一个浏览器扩展，让扩展通过浏览器提供的 bookmarks API 读取本地 profile 的书签树，然后推送给 Dockmark。

Chrome 的 `chrome.bookmarks` API 支持读取、创建、移动、更新、删除书签，并且书签以树结构组织；`getTree()` 可以获取整个书签树，`onCreated`、`onChanged`、`onMoved`、`onRemoved` 等事件可以监听变化。([Chrome for Developers][5])

Firefox / WebExtensions 也提供 bookmarks API，MDN 文档说明扩展需要声明 `bookmarks` 权限，并可获取、编辑、移除和管理书签。([MDN Web Docs][6])

## 8.2 同步方向

第一阶段只做：

```text
浏览器 → Dockmark
```

不要一开始做：

```text
浏览器 ↔ Dockmark ↔ 其他浏览器
```

原因：

```text
1. 单向同步不会误删浏览器书签
2. 不需要处理复杂冲突
3. 不会和 Chrome / Edge / Firefox 自带同步打架
4. 实现难度低很多
```

## 8.3 浏览器扩展结构

```text
dockmark-extension/
  manifest.json
  src/
    background.ts
    popup/
      App.vue
    sync/
      fullSync.ts
      opQueue.ts
      normalize.ts
      api.ts
```

Manifest 示例：

```json
{
  "manifest_version": 3,
  "name": "Dockmark Sync",
  "version": "0.1.0",
  "permissions": ["bookmarks", "storage", "alarms"],
  "host_permissions": ["https://nav.example.com/*"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_popup": "popup.html"
  }
}
```

`alarms` 可用于让扩展 service worker 定期执行同步或校验任务。Chrome 的 alarms API 支持在 service worker 中创建定时 alarm 并响应触发事件。([Chrome for Developers][7])

## 8.4 设备配对流程

不要把全局 API key 写进扩展。

推荐：

```text
1. Web 后台点击“添加同步设备”
2. Dockmark 生成一次性 pairing code
3. 扩展输入站点地址 + pairing code
4. 扩展向 /api/sync/pair/finish 换取 client_id + sync_token
5. sync_token 只展示一次
6. 服务端只保存 token_hash
7. 扩展把 token 存到浏览器本地 storage
```

请求头：

```http
Authorization: Bearer <sync_token>
X-Dockmark-Client: <client_id>
```

好处：

```text
1. 可以单独吊销某台浏览器
2. 不依赖网页登录态
3. 适合扩展后台任务
4. 泄漏面更小
```

---

## 8.5 初次全量同步

扩展执行：

```ts
const tree = await chrome.bookmarks.getTree()
```

然后 flatten 为节点数组：

```ts
type BookmarkNodePayload = {
  browserNodeId: string
  parentBrowserNodeId?: string
  type: 'folder' | 'bookmark'
  title: string
  url?: string
  position: number
  folderPath: string
  dateAdded?: number
  dateGroupModified?: number
  checksum: string
}
```

发送：

```http
POST /api/sync/full
```

请求体：

```json
{
  "clientId": "client_abc",
  "snapshotId": "snap_20260527_001",
  "nodes": [
    {
      "browserNodeId": "123",
      "parentBrowserNodeId": "1",
      "type": "bookmark",
      "title": "Vaultwarden",
      "url": "https://vault.example.com",
      "position": 0,
      "folderPath": "Bookmarks Bar/Homelab",
      "checksum": "sha256..."
    }
  ]
}
```

Worker 处理：

```text
1. 验证 client_id + sync_token
2. 写入 sync_snapshots
3. upsert browser_bookmark_nodes
4. 本次快照没有出现的旧节点标记 is_deleted = 1
5. 更新 bookmarks 规范化表
6. 清理 KV 缓存
7. 返回同步结果
```

---

## 8.6 增量同步

扩展监听：

```ts
chrome.bookmarks.onCreated.addListener(...)
chrome.bookmarks.onChanged.addListener(...)
chrome.bookmarks.onMoved.addListener(...)
chrome.bookmarks.onRemoved.addListener(...)
```

事件不要立即上传，应该进入本地队列：

```text
浏览器事件
  ↓
本地 pending_ops
  ↓ debounce 3-10 秒
POST /api/sync/ops
```

请求体：

```json
{
  "clientId": "client_abc",
  "ops": [
    {
      "opId": "op_001",
      "type": "created",
      "browserNodeId": "456",
      "occurredAt": 1779810000000,
      "node": {
        "title": "Immich",
        "url": "https://photos.example.com",
        "folderPath": "Bookmarks Bar/Homelab"
      }
    }
  ]
}
```

服务端用 `opId` 做幂等，避免扩展重试导致重复写入。

---

## 8.7 定期全量校验

即使做了增量事件，也要保留全量校验。

建议：

```text
每次扩展启动：检查上次同步时间
每 6 小时：轻量同步
每天：全量 snapshot
手动按钮：立即全量同步
```

原因：

```text
1. 扩展 service worker 可能被挂起
2. 浏览器批量导入时事件很多
3. 用户可能在其他设备改了书签
4. 增量事件偶尔会漏
```

---

# 9. 数据模型设计

## 9.1 服务分类

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 9.2 服务条目

```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  icon_type TEXT NOT NULL DEFAULT 'emoji',

  primary_url TEXT NOT NULL,
  internal_url TEXT,

  credential_hint TEXT,
  note TEXT,

  status TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,

  source_bookmark_id TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

`status` 建议：

```text
active
hidden
archived
```

`icon_type` 建议：

```text
emoji
url
favicon
r2
simple-icons
```

## 9.3 服务端点

```sql
CREATE TABLE endpoints (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,

  label TEXT NOT NULL,
  url TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'public',

  is_primary INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 9.4 标签

```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_tags (
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);
```

## 9.5 同步客户端

```sql
CREATE TABLE sync_clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  browser TEXT,
  device_label TEXT,

  token_hash TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,

  last_seen_at TEXT,
  last_full_sync_at TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 9.6 配对码

```sql
CREATE TABLE sync_pairing_codes (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  name TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 9.7 浏览器原始书签树

```sql
CREATE TABLE browser_bookmark_nodes (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES sync_clients(id) ON DELETE CASCADE,

  browser_node_id TEXT NOT NULL,
  parent_browser_node_id TEXT,

  type TEXT NOT NULL,
  title TEXT,
  url TEXT,

  position INTEGER,
  folder_path TEXT,

  date_added_ms INTEGER,
  date_modified_ms INTEGER,

  checksum TEXT NOT NULL,

  is_deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,

  last_seen_snapshot_id TEXT,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(client_id, browser_node_id)
);

CREATE INDEX idx_browser_nodes_client
ON browser_bookmark_nodes(client_id);

CREATE INDEX idx_browser_nodes_url
ON browser_bookmark_nodes(url);

CREATE INDEX idx_browser_nodes_path
ON browser_bookmark_nodes(folder_path);
```

## 9.8 规范化书签

```sql
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,

  title TEXT NOT NULL,
  url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,

  description TEXT,
  source TEXT NOT NULL DEFAULT 'browser',

  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT,

  archived INTEGER NOT NULL DEFAULT 0,

  UNIQUE(normalized_url)
);
```

## 9.9 书签来源

```sql
CREATE TABLE bookmark_sources (
  bookmark_id TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES sync_clients(id) ON DELETE CASCADE,
  browser_node_id TEXT NOT NULL,

  folder_path TEXT,
  title TEXT,

  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (bookmark_id, client_id, browser_node_id)
);
```

## 9.10 同步操作日志

```sql
CREATE TABLE sync_ops (
  id TEXT PRIMARY KEY,

  client_id TEXT NOT NULL REFERENCES sync_clients(id) ON DELETE CASCADE,
  op_type TEXT NOT NULL,
  browser_node_id TEXT NOT NULL,

  payload_json TEXT,
  occurred_at INTEGER,

  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

# 10. URL 归一化策略

用于去重的 `normalized_url` 不应直接等于原始 URL。

建议规则：

```text
1. protocol 小写
2. hostname 小写
3. 去掉默认端口 :80 / :443
4. 去掉末尾 /
5. 去掉常见 tracking 参数
6. query 参数按 key 排序
7. hash 默认保留
```

默认删除参数：

```text
utm_source
utm_medium
utm_campaign
utm_term
utm_content
fbclid
gclid
yclid
mc_cid
mc_eid
```

示例：

```text
https://EXAMPLE.com/docs/?utm_source=x&b=2&a=1/
```

归一化为：

```text
https://example.com/docs?a=1&b=2
```

---

# 11. API 设计

## 11.1 认证相关

```text
GET  /api/me
POST /api/auth/logout
```

如果使用 Cloudflare Access，Worker 应该验证 Access 注入的 JWT。Cloudflare 官方建议验证 `Cf-Access-Jwt-Assertion` header，并用公钥确认请求确实来自 Access。([Cloudflare Docs][8])

---

## 11.2 服务导航

```text
GET    /api/nav
GET    /api/items
POST   /api/items
GET    /api/items/:id
PATCH  /api/items/:id
DELETE /api/items/:id
```

`GET /api/nav` 返回首页直接可渲染数据：

```json
{
  "categories": [
    {
      "id": "cat_media",
      "name": "媒体",
      "items": [
        {
          "id": "item_immich",
          "name": "Immich",
          "icon": "📷",
          "primaryUrl": "https://photos.example.com",
          "internalUrl": "http://192.168.1.20:2283",
          "credentialHint": "Vaultwarden 搜 Immich",
          "tags": ["photos", "family"]
        }
      ]
    }
  ]
}
```

---

## 11.3 分类与标签

```text
GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id

GET    /api/tags
POST   /api/tags
DELETE /api/tags/:id
```

---

## 11.4 书签

```text
GET    /api/bookmarks
GET    /api/bookmarks/tree
GET    /api/bookmarks/recent
GET    /api/bookmarks/duplicates
POST   /api/bookmarks/:id/promote
PATCH  /api/bookmarks/:id
DELETE /api/bookmarks/:id
```

---

## 11.5 同步

```text
POST /api/sync/pair/start
POST /api/sync/pair/finish

GET  /api/sync/client
POST /api/sync/full
POST /api/sync/ops
POST /api/sync/ping

GET    /api/sync/clients
PATCH  /api/sync/clients/:id
DELETE /api/sync/clients/:id
```

---

## 11.6 导入导出

```text
POST /api/import/json
POST /api/import/bookmarks-html
GET  /api/export/json
POST /api/export/r2
```

---

# 12. 缓存设计

## 12.1 KV Key 设计

```text
nav:home:v1
nav:home:user:<user_id>:v1

bookmarks:recent:v1
bookmarks:tree:client:<client_id>:v1
bookmarks:search:<query_hash>:v1

settings:public:v1

favicon:<url_hash>
metadata:<url_hash>
```

## 12.2 失效策略

服务相关写入后删除：

```text
nav:home:v1
```

书签同步后删除：

```text
bookmarks:recent:v1
bookmarks:tree:*
bookmarks:search:*
```

MVP 阶段不必做复杂通配删除，可以维护一个 cache version：

```text
cache_version:nav
cache_version:bookmarks
```

读取时 key 带 version：

```text
nav:home:v12
bookmarks:recent:v8
```

更新时只递增 version。

---

# 13. 安全设计

## 13.1 访问控制

推荐：

```text
Cloudflare Access 保护整个 Dockmark 后台
/api/sync/* 使用设备 token
```

也就是：

```text
Web UI:
  Cloudflare Access

Browser Extension:
  sync_token
```

## 13.2 敏感信息策略

禁止入库：

```text
密码
API key
OAuth refresh token
2FA seed
SSH private key
真实 session cookie
```

允许入库：

```text
Vaultwarden 搜索词
服务备注
登录入口说明
非敏感账号说明
```

## 13.3 Token 存储

服务端：

```text
只存 token_hash
不存明文 token
```

扩展端：

```text
chrome.storage.local
```

支持：

```text
吊销设备
禁用设备
查看最近同步时间
重新生成 token
```

## 13.4 API 防护

建议：

```text
所有写接口必须鉴权
所有输入做 schema 校验
D1 查询使用 prepared statements
同步接口限制 payload 大小
导入接口限制文件大小
token 比较使用安全 hash
```

D1 访问层用 prepared statements + bind，避免拼接 SQL。Cloudflare D1 文档也推荐这种方式。([Cloudflare Docs][2])

---

# 14. 部署设计

## 14.1 项目结构

推荐 monorepo：

```text
dockmark/
  apps/
    web/
      src/
        main.ts
        App.vue
        pages/
        components/
        stores/
        api/

    worker/
      src/
        index.ts
        routes/
        services/
        db/
        auth/
        cache/
        sync/

    extension/
      src/
        background.ts
        popup/
        sync/

  packages/
    shared/
      src/
        schema/
        types/
        url/
        crypto/

  migrations/
    0001_init.sql
    0002_bookmark_sync.sql

  wrangler.jsonc
  package.json
  README.md
```

## 14.2 Wrangler 配置示例

```jsonc
{
  "name": "dockmark",
  "main": "apps/worker/src/index.ts",
  "compatibility_date": "2026-05-27",
  "assets": {
    "directory": "apps/web/dist",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "dockmark",
      "database_id": "xxxx"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "xxxx"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "dockmark-assets"
    }
  ]
}
```

R2 没开时：

```jsonc
{
  "name": "dockmark",
  "main": "apps/worker/src/index.ts",
  "compatibility_date": "2026-05-27",
  "assets": {
    "directory": "apps/web/dist",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "dockmark",
      "database_id": "xxxx"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "xxxx"
    }
  ]
}
```

---

# 15. Worker 内部模块划分

```text
routes/
  nav.ts
  items.ts
  categories.ts
  tags.ts
  bookmarks.ts
  sync.ts
  importExport.ts
  settings.ts

services/
  navService.ts
  itemService.ts
  bookmarkService.ts
  syncService.ts
  cacheService.ts
  authService.ts
  faviconService.ts

db/
  client.ts
  schema.ts
  repositories/
    itemRepo.ts
    bookmarkRepo.ts
    syncRepo.ts

auth/
  accessJwt.ts
  syncToken.ts

cache/
  keys.ts
  invalidation.ts

utils/
  id.ts
  urlNormalize.ts
  hash.ts
  time.ts
```

---

# 16. 前端体验设计

## 16.1 首页导航

首页优先服务访问体验。

功能：

```text
1. 搜索服务
2. 按分类展示
3. 服务卡片
4. 快捷打开公网地址
5. 展开内网地址 / 备用地址
6. 显示 Vaultwarden 搜索提示
7. 显示标签
8. 支持键盘快速搜索
```

服务卡片示例：

```text
┌─────────────────────────────┐
│ 📷 Immich                   │
│ 家庭照片管理                 │
│                             │
│ 打开公网地址                 │
│ 内网地址  账号提示  备注      │
│                             │
│ #photos #family             │
└─────────────────────────────┘
```

## 16.2 服务详情页

```text
基础信息
访问地址
内网地址
备用地址
账号提示
备注
标签
来源书签
更新时间
```

## 16.3 书签页

视图：

```text
全部书签
文件夹树
最近新增
重复链接
按域名分组
已删除
```

每个书签操作：

```text
打开
复制链接
归档
提升为服务
查看来源设备
```

## 16.4 同步设备页

展示：

```text
设备名称
浏览器类型
最近同步时间
书签数量
文件夹数量
状态
重新同步
吊销 token
删除设备
```

---

# 17. MVP 范围

## 17.1 MVP 目标

第一版目标：

> 能部署、能登录、能维护服务入口、能从浏览器导入书签、能用扩展单向同步。

## 17.2 MVP 功能清单

```text
1. Vue 3 前端
2. Worker API
3. D1 migration
4. Cloudflare Access 保护
5. 服务 CRUD
6. 分类 CRUD
7. 标签基础功能
8. 首页导航
9. KV 缓存 /api/nav
10. JSON 导入导出
11. bookmarks.html 导入
12. Chrome / Edge 扩展
13. 扩展 pairing code
14. getTree() 全量同步
15. 书签列表与树视图
16. Promote to Service
```

---

# 18. 后续规划

## Phase 0：项目骨架

目标：先跑起来。

```text
1. 初始化 monorepo
2. 创建 Vue 3 应用
3. 创建 Worker API
4. 配置 Wrangler
5. 创建 D1 数据库
6. 创建 KV namespace
7. 完成基础部署
```

产物：

```text
https://dockmark.example.com
```

---

## Phase 1：服务导航核心

目标：替代个人导航页。

```text
1. categories 表
2. items 表
3. endpoints 表
4. tags 表
5. 服务 CRUD
6. 首页分类展示
7. 搜索
8. 账号提示字段
9. JSON 导入导出
10. KV 缓存
```

完成后，Dockmark 已经能作为 Homelab 首页使用。

---

## Phase 2：浏览器书签导入

目标：先不用扩展，也能导入。

```text
1. 支持 bookmarks.html
2. 解析文件夹树
3. 写入 browser_bookmark_nodes
4. 生成 bookmarks 规范表
5. 书签树展示
6. 重复 URL 合并
7. Promote to Service
```

---

## Phase 3：浏览器扩展单向同步

目标：自动同步浏览器书签。

```text
1. Chrome / Edge MV3 扩展
2. pairing code
3. sync token
4. getTree() 全量同步
5. onCreated / onChanged / onMoved / onRemoved 增量队列
6. 定时 full sync
7. 同步设备管理
8. 同步日志
```

---

## Phase 4：体验增强

目标：更像一个真正的个人控制台。

```text
1. 命令面板
2. 快捷键
3. 最近访问
4. 收藏服务
5. 常用服务置顶
6. 图标自动抓取
7. Simple Icons 集成
8. 服务卡片布局自定义
9. 深色模式
10. 移动端适配
```

---

## Phase 5：R2 增强

目标：支持文件型能力。

```text
1. 上传自定义图标
2. 上传服务截图
3. 导出备份到 R2
4. 自动保留最近 N 个备份
5. 书签网页快照，可选
```

---

## Phase 6：高级同步，可选

目标：谨慎探索双向同步。

```text
1. 只对 “Dockmark Managed” 文件夹做双向同步
2. 服务端修改同步回浏览器
3. 冲突记录
4. 手动冲突解决
5. 删除保护
6. 回收站
```

这个阶段一定要谨慎。双向同步的复杂度远高于单向同步，尤其涉及删除、移动、排序和多浏览器自带同步。

---

# 19. 关键风险与取舍

## 19.1 Cloudflare Worker 不能直接访问你的内网服务

如果你的服务地址是：

```text
http://192.168.1.10:8096
```

Worker 在 Cloudflare 边缘运行，不能直接访问你家里的局域网地址。因此：

```text
1. 服务健康检查只能检查公网地址
2. 内网地址只能作为链接展示
3. 真实访问由用户浏览器本地完成
```

解决方案：

```text
1. 公网服务走 Cloudflare Tunnel
2. 内网服务只展示 LAN URL
3. 前端可选做本地探测，但受浏览器 CORS 和混合内容限制
```

## 19.2 KV 不是数据库

KV 用于缓存，不用于存主数据。

错误用法：

```text
把服务列表只存在 KV
```

正确用法：

```text
D1 存服务列表
KV 缓存首页渲染结果
```

## 19.3 不要保存密码

Dockmark 的安全边界必须清晰：

```text
Vaultwarden = 密码保险箱
Dockmark = 服务目录与账号位置提示
```

## 19.4 双向同步不要太早做

第一版只做单向同步：

```text
Browser → Dockmark
```

否则你会很快遇到：

```text
谁覆盖谁
谁删除谁
文件夹排序冲突
浏览器自带同步冲突
误删恢复
```

---

# 20. 推荐开发顺序

最实际的顺序：

```text
1. 建项目骨架
2. 建 D1 schema
3. 做服务导航 CRUD
4. 做首页
5. 加 KV 缓存
6. 加 Cloudflare Access
7. 做 JSON 导入导出
8. 做 bookmarks.html 导入
9. 做浏览器扩展 pairing
10. 做 getTree 全量同步
11. 做增量同步
12. 做 Promote to Service
13. 再考虑 R2
```

也就是：

```text
先让 Dockmark 成为好用的 Homelab 首页
再让它成为浏览器书签同步中心
最后再做图标、截图、备份这些增强能力
```

---

# 21. README 开头草案

```markdown
# Dockmark

Dockmark is a serverless dock for your homelab services and browser bookmarks.

It helps you manage self-hosted service entries, public and internal URLs, categories, tags, access notes, and Vaultwarden lookup hints — without storing any passwords.

Dockmark runs on Cloudflare Workers, D1, and KV, with optional R2 support for icons, screenshots, and backups.

## Features

- Homelab service dashboard
- Public, LAN, Tailscale, and admin endpoints
- Categories and tags
- Vaultwarden credential hints
- Browser bookmark import
- Browser extension sync
- Promote bookmark to service
- JSON import/export
- Cloudflare Access friendly
- Serverless-first architecture
```

---

# 22. 最终定位

Dockmark 的准确定位应该是：

```text
不是 Homepage 的完全替代
不是 Linkwarden 的完全替代
不是 Vaultwarden 的替代
不是复杂知识库

而是：

个人 Homelab 服务入口
+ 浏览器书签同步
+ Vaultwarden 账号提示索引
+ Cloudflare Serverless 部署
```

最稳的产品路线是：

```text
MVP：服务导航
增强：书签导入
核心差异化：浏览器扩展同步
高级能力：Promote to Service
可选增强：R2 图标、截图、备份
谨慎扩展：受管文件夹双向同步
```

用一句话总结：

> **Dockmark 是一个安全边界清晰、部署成本低、专为个人自部署服务设计的 serverless 导航与书签同步系统。**
