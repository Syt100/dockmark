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

`AUTH_MODE=builtin` 已提交在 `env.production.vars` 中。`SETUP_TOKEN` 不写入 `wrangler.jsonc`，只通过 GitHub Actions secret 或 Wrangler secret/secret file 注入。`wrangler.jsonc` 仅声明该 secret 为必需项：

```json
{
  "secrets": {
    "required": ["SETUP_TOKEN"]
  }
}
```

首次部署流程：

1. 如生产 D1 不存在，先创建 `dockmark-production`。
2. 应用生产 D1 迁移。
3. 使用 `wrangler deploy --secrets-file` 部署 Worker 和前端 assets。
4. Wrangler 根据 `env.production` 自动创建并绑定 KV。
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
- `compatibility_date` 应定期更新；每次更新必须运行 Worker typecheck、runtime integration tests、`corepack pnpm validate` 和 OpenSpec 全量校验。
- Worker observability 必须显式启用并配置采样率；调整采样率时要记录原因，避免排障时缺少日志/trace 样本。
- `AUTH_MODE=oidc` 和 `AUTH_MODE=cloudflare-access` 是预留模式，当前会拒绝访问并提示改用 builtin。
- 业务代码只能依赖标准用户上下文。
- OIDC 和 Cloudflare Access 需要后续 OpenSpec change 实现后才能用于生产。
- 生产必须使用 HTTPS，认证 cookie 使用 HttpOnly、SameSite=Lax，并在 HTTPS 请求下设置 Secure。
- Dockmark 可以存储自身登录密码的哈希验证器，但仍禁止存储 Homelab 服务密码、API key、token、OTP seed、浏览器 session cookie 或其他服务秘密。

## 5. GitHub Actions 自动部署

`.github/workflows/cloudflare.yml` 会在 deploy-relevant 路径变更的 pull request 和 `main` push 时运行验证，在 deploy-relevant 路径变更的 `main` push 或手动触发时部署生产环境。

自动触发路径只覆盖会影响构建、测试、迁移或 Cloudflare 部署的内容：

- `.github/workflows/cloudflare.yml`
- `apps/**`
- `packages/**`
- `migrations/**`
- `seeds/**`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`

纯仓库维护类变更不会自动触发 Cloudflare workflow，例如 `.github/dependabot.yml`、文档、OpenSpec proposal/spec/tasks。需要强制验证或部署时，仍可通过 `workflow_dispatch` 手动触发。

Dependabot 依赖更新通过 `.github/dependabot.yml` 管理：

- npm/pnpm 更新只配置 `directory: "/"`，由根目录统一处理整个 pnpm workspace。不要为 `apps/web`、`apps/worker`、`apps/extension` 或 `packages/shared` 单独配置 npm 更新目录；Dependabot 不支持从 pnpm workspace 子目录更新，容易产生 lockfile 不完整或动态扫描失败。
- production 和 development 的 minor/patch 更新分别分组，减少 PR 数量。
- npm security updates 单独分组，优先处理。
- `@types/node` 的 major 更新暂时忽略，直到项目明确从 Node 24 类型策略升级。
- `npm-run-all2` 的 major 更新暂时忽略，直到项目明确提高 Node engine 要求。
- GitHub Actions 更新单独配置为每周检查一次。

GitHub repository secrets：

- `CLOUDFLARE_API_TOKEN`：Cloudflare API token，至少需要部署 Worker、操作 D1 和自动创建绑定资源的权限。
- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare Account ID。
- `DOCKMARK_SETUP_TOKEN`：首次初始化管理员使用的强随机 setup token。

自动部署顺序：

1. `corepack pnpm validate`。
2. `cf-typecheck` 校验 Wrangler 生成的绑定类型。
3. `deploy:dry-run` 检查 Worker 绑定。
4. 生成临时 `worker-secrets.json`，只在 runner 内保存 `SETUP_TOKEN`。
5. 通过 `wrangler d1 list --json` 检查生产 D1 是否存在；不存在时自动创建 `dockmark-production`。
6. 生成临时 D1 migration config，只在 runner 内补入远程 D1 ID，并执行生产 D1 迁移。
7. 使用 `wrangler deploy --secrets-file` 单次部署 Worker 和前端 assets。

该流程不把个人 Cloudflare 资源 ID 写入公开仓库；D1 ID 只存在于 GitHub Actions runner 的临时文件中。日常 push 只产生一次 Worker 部署版本。

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
- 生产 D1 `dockmark-production` 已存在；GitHub Actions 会在缺失时自动创建。
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

`corepack pnpm validate` 是只读门禁，会执行 typecheck、测试、lint check、format check 和 build，不应改写源码、格式或 lint 结果。需要自动修复时，先本地显式运行 `corepack pnpm lint:fix` 或 `corepack pnpm format`，再重新运行验证。

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
2. 运行 `corepack pnpm --filter @dockmark/worker cf-typecheck`，确认 Wrangler 绑定类型和配置一致。
3. 运行 `corepack pnpm deploy:dry-run`，确认生产 Worker 绑定、assets 和 vars。
4. 首次部署或确认生产 D1/KV 已存在。
5. 应用生产 D1 迁移。
6. 部署 Worker 和前端 assets。
7. 打开 `/api/health` 检查版本和服务状态。
8. 打开 `/api/smoke` 检查 D1/KV 连通性。
9. 打开首页确认 `/api/nav` 正常返回。

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

- 生产 D1 已存在或将由 GitHub Actions 自动创建，KV 将由 Wrangler 部署时自动创建并绑定。
- `env.production.vars.AUTH_MODE=builtin`，且没有误配为尚未实现的 `oidc` 或 `cloudflare-access`。
- `compatibility_date` 更新已经通过 Worker runtime integration tests。
- Worker observability 已启用并设置了明确采样率。
- GitHub repository secret `DOCKMARK_SETUP_TOKEN` 已配置为强随机值，并在管理员初始化后移除或轮换。
- 已执行生产迁移。
- `corepack pnpm validate` 通过。
- `openspec validate --all --strict --no-interactive` 通过。
- `/api/health` 正常。
- `/api/smoke` 正常。
- `/api/nav` 正常。
- 没有提交真实密码、token、API key 或 Cloudflare secret。
