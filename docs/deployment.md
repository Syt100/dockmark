# Dockmark 部署与运维规范

本文档定义 Dockmark 在本地、预发布和生产环境中的 Cloudflare 配置、迁移和发布约定。

## 1. 环境划分

建议至少区分：

- 本地开发：Wrangler local D1、local KV、`AUTH_MODE=development`。
- 预发布：独立 D1/KV，接近生产认证配置。
- 生产：独立 D1/KV，禁止 development auth。

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

生产部署前必须创建真实资源，并替换 `apps/worker/wrangler.jsonc` 中的占位值：

- D1 database。
- KV namespace。
- 后续如需要，再创建 R2 bucket。

当前占位值：

```text
00000000-0000-0000-0000-000000000000
00000000000000000000000000000000
```

占位值只允许用于项目初始化，不能用于生产发布。

## 4. 认证配置

本地开发：

```json
{
  "AUTH_MODE": "development"
}
```

生产环境：

```json
{
  "AUTH_MODE": "cloudflare-access"
}
```

生产要求：

- 禁止使用 `AUTH_MODE=development`。
- Cloudflare Access 是第一种生产认证适配器，但不是唯一方案。
- 业务代码只能依赖标准用户上下文。
- 后续生产硬化必须校验 `Cf-Access-Jwt-Assertion`，不能只检查 header 是否存在。

## 5. 迁移流程

本地迁移：

```sh
corepack pnpm db:migrate:local
```

远程迁移：

```sh
corepack pnpm db:migrate:remote
```

远程迁移前检查：

- `wrangler.jsonc` 已指向目标环境 D1。
- 已确认当前 git 分支和提交。
- 已读过迁移 SQL。
- 迁移不包含破坏性删除，或已经有备份和回滚方案。
- 已在本地运行验证。

迁移原则：

- 迁移文件只追加。
- 不修改已发布迁移。
- 不在生产控制台手工改 schema 后忘记提交迁移。

## 6. 发布流程

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
corepack pnpm --filter @dockmark/worker deploy
```

发布顺序建议：

1. 合并代码前运行测试和 OpenSpec 校验。
2. 应用远程 D1 迁移。
3. 部署 Worker 和前端 assets。
4. 打开 `/api/health` 检查版本和服务状态。
5. 打开 `/api/smoke` 检查 D1/KV 连通性。
6. 打开首页确认 `/api/nav` 正常返回。

## 7. 回滚原则

- Worker 代码可以回滚到上一稳定提交重新部署。
- D1 迁移一旦远程执行，不能假设可以无损回滚。
- 破坏性 schema 变更必须拆成多步：
  1. 先新增兼容字段或表。
  2. 双写或兼容读取。
  3. 数据迁移。
  4. 确认稳定后再清理旧字段。

当前阶段应尽量避免破坏性迁移。

## 8. 缓存运维

- KV 不是事实源。
- 导航缓存异常时，应优先确认 D1 数据是否正确。
- `/api/nav` 缓存通过版本 key 失效，正常情况下不需要手工清 KV。
- 如果必须清理 KV，先确认不会影响其他环境。

## 9. 网络与依赖

项目 `.npmrc` 使用registry mirror：

```text
registry=<custom-registry>
prefer-offline=true
```

如遇网络慢或超时，可以使用代理：

```sh
corepack pnpm install
```

`git push` 如超时且代理可用，也可以考虑使用 `<local-proxy>`。

## 10. 生产上线检查清单

上线前至少确认：

- D1 database ID 已替换为真实生产 ID。
- KV namespace ID 已替换为真实生产 ID。
- `AUTH_MODE` 不是 `development`。
- 已执行远程迁移。
- `corepack pnpm validate` 通过。
- `openspec validate --all --strict --no-interactive` 通过。
- `/api/health` 正常。
- `/api/smoke` 正常。
- `/api/nav` 正常。
- 没有提交真实密码、token、API key 或 Cloudflare secret。
