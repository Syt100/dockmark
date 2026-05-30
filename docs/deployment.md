# Dockmark 部署与运维规范

本文档定义 Dockmark 在本地、预发布和生产环境中的 Cloudflare 配置、迁移和发布约定。

## 1. 环境划分

建议至少区分：

- 本地开发：顶层 Wrangler 配置、local D1、local KV、`AUTH_MODE=development`。
- 预发布：独立 Wrangler environment、独立 D1/KV，接近生产认证配置。
- 生产：`env.production` Wrangler environment、独立 D1/KV，禁止 development auth。

不同环境不得共用 D1 和 KV。

## 2. 本地开发

安装依赖：

```sh
corepack pnpm install
```

应用本地迁移：

```sh
corepack pnpm db:migrate:local
```

启动开发服务：

```sh
corepack pnpm dev
```

如果出现类似错误：

```text
D1_ERROR: no such table: categories
```

通常说明本地 D1 没有应用最新迁移。先停止开发服务，运行：

```sh
corepack pnpm db:migrate:local
```

再重新启动：

```sh
corepack pnpm dev
```

## 3. Cloudflare 资源

Dockmark 的 Wrangler 配置默认使用自动资源创建。首次生产部署时，Wrangler 会根据 `env.production` 的绑定配置自动 provision：

- D1 database：绑定名 `DB`，资源名 `dockmark-production`。
- KV namespace：绑定名 `KV`，由 Cloudflare/Wrangler 自动创建并绑定。
- 后续如需要，再创建 R2 bucket。

公开仓库不提交 D1 `database_id` 或 KV `id`。绑定名用于代码访问，例如 `env.DB` 和 `env.KV`；Cloudflare 资源 ID 由 Wrangler 管理。

如需手动创建并绑定资源，也可以先创建资源：

```sh
corepack pnpm --dir apps/worker exec wrangler d1 create dockmark-production
corepack pnpm --dir apps/worker exec wrangler kv namespace create dockmark-production
```

然后把输出的 D1 `database_id` 和 KV `id` 填入 `apps/worker/wrangler.jsonc` 的 `env.production`。一般情况下不需要这样做。

## 4. 认证配置

本地开发：

```json
{
  "AUTH_MODE": "development"
}
```

生产环境默认使用内置认证：

```json
{
  "AUTH_MODE": "builtin"
}
```

`AUTH_MODE=builtin` 已提交在 `env.production.vars` 中。`SETUP_TOKEN` 不写入 `wrangler.jsonc`，应通过 Wrangler secret 配置：

```sh
corepack pnpm --dir apps/worker exec wrangler secret put SETUP_TOKEN --env production
```

首次部署流程：

1. 部署 Worker，让 Wrangler 自动创建并绑定生产 D1/KV。
2. 配置 `SETUP_TOKEN` secret。
3. 应用生产 D1 迁移。
4. 再次部署 Worker。
5. 打开站点后进入初始化页面。
6. 输入 `SETUP_TOKEN`、管理员邮箱和密码创建管理员。
7. 初始化完成后，移除或轮换 `SETUP_TOKEN`。

可选配置：

```json
{
  "SESSION_COOKIE_NAME": "dockmark_session",
  "SESSION_TTL_SECONDS": "604800",
  "PASSWORD_PBKDF2_ITERATIONS": "100000"
}
```

生产要求：

- 禁止使用 `AUTH_MODE=development`。
- 当前生产默认使用 `AUTH_MODE=builtin`。
- 生产迁移和部署命令必须显式选择 Wrangler `production` environment。
- `AUTH_MODE=oidc` 和 `AUTH_MODE=cloudflare-access` 是预留模式，当前会拒绝访问并提示改用 builtin。
- 业务代码只能依赖标准用户上下文。
- OIDC 和 Cloudflare Access 需要后续 OpenSpec change 实现后才能用于生产。
- 生产必须使用 HTTPS，认证 cookie 使用 HttpOnly、SameSite=Lax，并在 HTTPS 请求下设置 Secure。
- Dockmark 可以存储自身登录密码的哈希验证器，但仍禁止存储 Homelab 服务密码、API key、token、OTP seed、浏览器 session cookie 或其他服务秘密。

## 5. GitHub Actions 自动部署

`.github/workflows/cloudflare.yml` 会在 pull request 和 `main` push 时运行验证，在 `main` push 或手动触发时部署生产环境。

GitHub repository secrets：

- `CLOUDFLARE_API_TOKEN`：Cloudflare API token，至少需要部署 Worker、写 Worker secret、操作 D1 和自动创建绑定资源的权限。
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare Account ID。
- `DOCKMARK_SETUP_TOKEN`：首次初始化管理员使用的强随机 setup token。

自动部署顺序：

1. `corepack pnpm validate`。
2. `cf-typecheck` 校验 Wrangler 生成的绑定类型。
3. `deploy:dry-run` 检查 Worker 绑定。
4. 首次真实部署，触发 Wrangler 自动创建 D1/KV。
5. 写入 `SETUP_TOKEN` Worker secret。
6. 按 `dockmark-production` 解析远程 D1 `database_id`，生成临时 migration config，并执行远程 D1 迁移。
7. 再次部署 Worker，确保迁移完成后的版本上线。

建议给 GitHub Environment `production` 配置 required reviewers，避免每次 push 到 `main` 都立即更新生产。

## 6. 迁移流程

本地迁移：

```sh
corepack pnpm db:migrate:local
```

生产远程迁移：

```sh
corepack pnpm db:migrate:production
```

生产远程迁移前检查：

- `wrangler.jsonc` 的 `env.production.d1_databases` 已配置 `binding=DB` 和生产资源名。
- 已确认当前 git 分支和提交。
- 已读过迁移 SQL。
- 迁移不包含破坏性删除，或已经有备份和回滚方案。
- 已在本地运行验证。

迁移原则：

- 迁移文件只追加。
- 不修改已发布迁移。
- 不在生产控制台手工改 schema 后忘记提交迁移。

## 7. 发布流程

建议发布前运行：

```sh
corepack pnpm validate
openspec validate --all --strict --no-interactive
```

构建检查：

```sh
corepack pnpm build
```

部署 Worker：

```sh
corepack pnpm deploy:production
```

发布顺序建议：

1. 合并代码前运行测试和 OpenSpec 校验。
2. 首次部署或确认生产 D1/KV 已存在。
3. 应用生产 D1 迁移。
4. 部署 Worker 和前端 assets。
5. 打开 `/api/health` 检查版本和服务状态。
6. 打开 `/api/smoke` 检查 D1/KV 连通性。
7. 打开首页确认 `/api/nav` 正常返回。

## 8. 回滚原则

- Worker 代码可以回滚到上一稳定提交重新部署。
- D1 迁移一旦远程执行，不能假设可以无损回滚。
- 破坏性 schema 变更必须拆成多步：
  1. 先新增兼容字段或表。
  2. 双写或兼容读取。
  3. 数据迁移。
  4. 确认稳定后再清理旧字段。

当前阶段应尽量避免破坏性迁移。

## 9. 缓存运维

- KV 不是事实源。
- 导航缓存异常时，应优先确认 D1 数据是否正确。
- `/api/nav` 缓存通过版本 key 失效，正常情况下不需要手工清 KV。
- 如果必须清理 KV，先确认不会影响其他环境。

## 10. 网络与依赖

仓库不固定 npm registry、镜像源或代理地址。依赖安装应默认使用 pnpm/Corepack 的标准解析行为。

如果开发者所在网络需要镜像源、离线缓存或代理，应通过用户级 npm/pnpm 配置、shell 环境变量或本机网络设置处理，不提交到仓库文档或项目配置。

## 11. 生产上线检查清单

上线前至少确认：

- 生产 D1/KV 已由 Wrangler 自动创建并绑定，或已手动绑定真实资源 ID。
- `env.production.vars.AUTH_MODE=builtin`，且没有误配为尚未实现的 `oidc` 或 `cloudflare-access`。
- 已用 Wrangler secret 配置强随机 `SETUP_TOKEN`，并在管理员初始化后移除或轮换。
- 已执行生产迁移。
- `corepack pnpm validate` 通过。
- `openspec validate --all --strict --no-interactive` 通过。
- `/api/health` 正常。
- `/api/smoke` 正常。
- `/api/nav` 正常。
- 没有提交真实密码、token、API key 或 Cloudflare secret。
