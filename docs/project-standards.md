# Dockmark 项目规范

本文档定义 Dockmark 的长期项目规范。目标是让后续阶段在功能扩展、数据迁移、部署和协作上保持一致。

## 1. 项目定位

Dockmark 是个人 Homelab 服务导航与浏览器书签同步系统。

优先级：

1. 服务导航优先。
2. 书签同步其次。
3. 永不做密码管理器。
4. Cloudflare Serverless 优先，但生产认证不能完全绑定 Cloudflare Access，后续应支持自托管认证。

## 2. 技术栈边界

- 包管理：pnpm workspace，通过 Corepack 使用。
- 前端：Vue 3、TypeScript、Vite、Vue Router、Tailwind CSS。
- 后端：Cloudflare Workers、Hono、TypeScript。
- 存储：D1 为事实源，KV 为可重建缓存，R2 仅作为后续可选对象存储。
- 浏览器扩展：MV3，放在后续阶段实现。

## 3. 目录边界

- `apps/web`：只放 Web UI、前端路由、前端 API client、前端测试。
- `apps/worker`：只放 Worker 入口、Hono 路由、中间件、Cloudflare binding 适配、D1/KV 访问、Worker 测试。
- `apps/extension`：只放浏览器扩展代码，不直接复用 Worker 内部模块。
- `packages/shared`：放前后端共享的 TypeScript 类型、输入校验、纯函数和共享测试。
- `migrations`：只放 D1 SQL 迁移文件，不放业务代码。
- `docs`：放设计文档、项目规范、部署说明和架构说明。
- `openspec`：放产品能力、阶段范围、需求场景和变更记录。

禁止方向：

- `apps/web` 不依赖 `apps/worker/src`。
- `apps/worker` 不依赖 `apps/web/src`。
- 业务逻辑不要直接写进 Vue 组件；可复用的数据结构和校验优先进入 `packages/shared`。
- Worker 路由不要直接拼复杂 SQL；复杂 D1 访问优先放到 `apps/worker/src/db`。

## 4. OpenSpec 规范

需要先写 OpenSpec 的情况：

- 新增或改变产品能力。
- 改变阶段范围。
- 改变核心数据模型。
- 改变 API 语义。
- 改变认证、安全、同步、导入导出、部署策略。

可以不写 OpenSpec 的情况：

- 拼写、注释、README、规范文档类修改。
- 不改变行为的重构。
- 开发脚本和工具的小修正。

OpenSpec 要求：

- spec/change 名称必须以阶段前缀开头。
- 主阶段使用 `phase-N-*`，例如 `phase-1-service-navigation`。一个主阶段只保留一个总 spec。
- 同一主阶段下拆出的子阶段使用 `phase-N.M-*`，例如 `phase-1.1-service-navigation-ux`、`phase-1.2-service-navigation-usability`。
- 子阶段编号按实施顺序递增；不要用多个 `phase-N-*` 同级名称表达同一主阶段下的拆分阶段。
- requirement 必须能被测试或人工验收。
- proposal 必须写清目标和 non-goals。
- design 必须记录关键取舍。
- tasks 必须按可交付 milestone 拆分。

## 5. 代码风格

- 使用 TypeScript，避免隐式 `any`。
- 优先使用已有项目模式，不为小问题引入新抽象。
- 共享类型、输入校验、URL 解析、ID 生成等跨端逻辑优先放到 `packages/shared`。
- Worker 端所有 SQL 使用 prepared statement 和参数绑定。
- 不把数据库 snake_case 字段直接泄漏给前端，API 返回对象使用 camelCase。
- 注释只用于解释不明显的约束、取舍或复杂逻辑，不写复述代码的注释。
- 具体代码编写细则见 [代码规范](code-conventions.md)。

## 6. 前端规范

- Dockmark 是工作型 Homelab 工具，不做营销页风格。
- 首屏优先是可用 dashboard，不做空泛 landing page。
- UI 应该信息密度适中，适合搜索、扫描、编辑和反复使用。
- 表单字段命名必须体现安全边界，例如使用 “Vaultwarden lookup hint”，而不是 username/password。
- 删除、导入、同步、覆盖等风险操作必须有明确确认或可理解反馈。
- 组件样式优先复用当前 Tailwind 风格，不引入大型 UI 框架，除非对应 phase 明确决策。

## 7. 后端规范

- Worker 入口只负责组合路由、中间件和全局错误处理。
- 认证逻辑通过 auth adapter 暴露标准用户上下文，业务代码不直接读取认证提供方私有 header。
- API 输入必须校验，校验失败返回 400。
- 所有写操作必须考虑缓存失效。
- 所有写操作必须考虑 D1 约束和级联关系。
- D1 是唯一事实源；KV 只能缓存 `/api/nav` 等可重建数据。

## 8. 数据库与迁移规范

- 所有 schema 变化必须写入 `migrations/*.sql`。
- 迁移文件只追加，不修改已经发布或可能被他人运行过的迁移。
- 新增迁移后，本地开发必须运行：

```sh
corepack pnpm db:migrate:local
```

- 远程迁移只能在确认 Cloudflare 资源 ID 和环境后运行：

```sh
corepack pnpm db:migrate:remote
```

- 数据库字段命名使用 snake_case。
- API 和前端类型命名使用 camelCase。
- 涉及唯一性、级联删除、缓存失效、URL 归一化、同步幂等的迁移或逻辑必须补测试。

## 9. 安全规范

- 不保存密码、API key、token、OTP seed、session cookie 或任何可直接登录系统的秘密。
- 账号相关说明只能保存为 `credentialHint`，用于提示用户去 Vaultwarden 或其他密码管理器搜索。
- 浏览器扩展后续如需 client token，服务端只能保存 hash，明文 token 只展示一次。
- 生产认证不得依赖 `AUTH_MODE=development`。
- Cloudflare Access 是第一种生产认证适配器，但不是唯一认证方案。
- 后续上线前，Cloudflare Access JWT 必须做真实校验，不能只信任 header 存在。

## 10. 测试规范

- 改 `packages/shared` 的类型、校验、纯函数时，补共享包测试。
- 改 Worker route、repository、auth、cache、migration 相关行为时，补 Worker 测试。
- 改前端关键流程、表单、错误展示、导航渲染时，补 Web 测试。
- 容易漏掉的行为必须有回归测试，特别是：
  - URL 校验和归一化。
  - 导入解析。
  - KV 缓存失效。
  - 同步幂等。
  - 凭据字段禁存。
  - 主 endpoint 唯一性。

常用验证命令：

```sh
corepack pnpm validate
openspec validate --all --strict --no-interactive
```

## 11. Git 与提交规范

- 按 milestone 或 bug fix 提交。
- 提交信息包含摘要和变更点。
- 不把不相关格式化混入功能提交。
- 不回滚用户已有改动。
- 发现工作区有未知改动时，先判断是否与当前任务相关；无关则忽略，相关则基于现状继续。

## 12. 网络与依赖规范

- 优先使用项目 `.npmrc` 中的registry mirror。
- 网络慢或超时时，可以为 pnpm 配置代理：

```sh
corepack pnpm install
```

- 新增依赖前必须判断是否真的需要，优先使用现有栈和标准库。
- 创建新项目、子应用、扩展模板时，优先使用官方脚手架。
