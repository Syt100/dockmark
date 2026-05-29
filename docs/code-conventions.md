# Dockmark 代码规范

本文档定义 Dockmark 的代码编写规范。项目规范负责说明“项目怎么协作”，本文档负责说明“代码怎么写”。

## 1. 总原则

- 优先遵循当前代码库已有模式。
- 优先写直接、可读、可测试的代码，不为尚未出现的复杂度提前设计抽象。
- 公共类型、校验和纯函数放到 `packages/shared`。
- 端侧实现保持边界清晰：Web 不依赖 Worker 内部模块，Worker 不依赖 Web 内部模块。
- 修改容易被遗漏的行为时，同步补测试。

## 2. TypeScript 规范

- 默认使用 TypeScript，不新增 JavaScript 业务文件。
- 避免使用 `any`。确实需要时，优先用 `unknown` 加类型收窄。
- 函数入参和公开返回值应有清晰类型。
- 类型优先使用 `type`，只有需要声明合并或面向类式扩展时再使用 `interface`。
- 联合字符串应集中定义为 `as const` 数组，再派生类型。
- 不把数据库 row 类型直接暴露给前端或共享包。

推荐模式：

```ts
export const itemStatuses = ['active', 'hidden', 'archived'] as const
export type ItemStatus = (typeof itemStatuses)[number]
```

避免：

```ts
type ItemStatus = string
```

## 3. 命名规范

- 文件名使用 kebab-case 或已有目录约定。
- TypeScript 变量、函数、对象字段使用 camelCase。
- 类型、组件、类使用 PascalCase。
- 数据库字段、SQL alias 使用 snake_case。
- 常量如果是局部语义，使用 camelCase；如果是真正全局常量，可使用 SCREAMING_SNAKE_CASE。
- 布尔值命名优先使用 `is`、`has`、`should`、`can` 前缀。

示例：

```ts
const isPrimary = endpoint.isPrimary
const hasCredentialHint = item.credentialHint !== null
```

## 4. 模块边界

`packages/shared` 可以包含：

- API 输入输出类型。
- 共享校验函数。
- URL、slug、ID 等纯函数。
- 不依赖 Cloudflare、Vue、DOM 的逻辑。

`apps/worker` 可以包含：

- Hono route。
- 中间件。
- D1/KV repository。
- Cloudflare binding 适配。
- Worker 专属测试。

`apps/web` 可以包含：

- Vue 组件和页面。
- Vue Router。
- 前端 API client。
- 前端状态和交互逻辑。
- Web 专属测试。

禁止：

- `packages/shared` 引入 Hono、Vue、Wrangler、Cloudflare Worker 类型。
- `apps/web` 直接导入 `apps/worker/src/*`。
- `apps/worker` 直接导入 `apps/web/src/*`。

## 5. 导入规范

- 类型导入使用 `import type`。
- 同一模块的值导入和类型导入可以分开，保持清晰。
- 优先使用 workspace 包名导入共享模块，例如 `@dockmark/shared`。
- 避免深层跨包导入，例如不从 `@dockmark/shared/src/navigation` 导入，除非包导出策略明确允许。
- import 顺序保持简单：
  1. 第三方包。
  2. workspace 包。
  3. 当前包内相对路径。

示例：

```ts
import { Hono } from 'hono'
import type { NavResponse } from '@dockmark/shared'

import { getNavigation } from '../db/items'
```

## 6. Worker 代码规范

- `src/index.ts` 只负责创建 app、注册全局错误处理和挂载 route。
- route 文件负责 HTTP 语义，不写复杂 SQL。
- D1 访问放在 `src/db/*`。
- 通用 HTTP 工具放在 `src/lib/*`。
- 中间件放在 `src/middleware/*`。
- 所有 SQL 必须使用 prepared statement 和 `.bind()`。
- 写操作完成后必须处理相关缓存失效。
- 不在业务 route 中直接读取 Cloudflare Access 私有 header，认证统一通过 auth adapter。

推荐结构：

```ts
itemsRoute.post('/', requireAuth, async (c) => {
  const input = requireValidation(validateServiceItemInput(await readJson(c)))
  const item = await createItem(c.env.DB, input)
  await incrementNavCacheVersion(c.env.KV)

  return c.json({ item }, 201)
})
```

## 7. D1 与 SQL 规范

- 表和字段使用 snake_case。
- API mapper 负责 snake_case 到 camelCase 的转换。
- 查询参数必须通过 `.bind()` 注入。
- 不拼接用户输入到 SQL 字符串。
- 动态排序字段必须白名单化。
- 涉及多表写入时，要考虑中间失败后的状态一致性。
- 外键、唯一约束、级联删除的行为必须有测试覆盖。

允许的动态 SQL 场景：

- 根据可信数组生成固定数量的 placeholder。
- 根据白名单选择排序字段或过滤字段。

禁止：

```ts
db.prepare(`SELECT * FROM items ORDER BY ${userInput}`)
```

## 8. API 代码规范

- 请求体先 `readJson`，再调用共享校验函数。
- 业务错误使用 `HTTPException` 或统一错误 helper。
- 成功响应使用对象包裹资源，例如 `{ item }`、`{ items }`。
- 删除成功返回 204。
- API 字段保持 camelCase。
- 新增错误类型时，同步参考 `docs/api-conventions.md`。

## 9. Vue 代码规范

- Vue 页面优先使用 `<script setup lang="ts">`。
- 页面组件可以承载页面级状态；可复用复杂逻辑再抽成 composable。
- 表单提交前端可做基础约束，但后端仍必须校验。
- 组件内不要直接写复杂数据转换；共享转换逻辑优先放 `packages/shared`，前端专属转换可放 `src/api` 或局部 helper。
- UI 文案要明确表达安全边界，账号字段使用 credential hint，不出现 password/token 输入。
- 保持页面适合管理工具使用，避免营销页式布局。

## 10. 样式规范

- 当前项目优先使用 Tailwind CSS。
- 样式以清晰、稳定、可扫描为主。
- 不为单次使用创建过度抽象的组件或样式层。
- 表格、表单、管理列表要保证移动端不发生明显溢出。
- 颜色和间距优先沿用已有页面风格。

## 11. 错误处理规范

- 后端未知错误只返回通用信息，不把 stack trace 返回给客户端。
- 前端应展示可理解的错误信息，不直接把巨大 JSON 错误堆到页面。
- 校验错误应尽量保留具体字段信息。
- 涉及安全边界的错误信息要明确，例如“不能保存 token/password”。

## 12. 测试规范

- 共享校验和纯函数使用 `packages/shared` 测试。
- Worker route、repository、cache、auth 使用 `apps/worker` 测试。
- Vue 页面和关键交互使用 `apps/web` 测试。
- 回归测试优先覆盖行为，不只覆盖实现细节。
- 测试名称应描述用户可观察行为或业务规则。

必须优先补测试的场景：

- URL 校验、slug 生成、ID 生成。
- 禁止保存秘密字段。
- 主 endpoint 唯一性。
- D1 级联删除和唯一约束。
- KV 导航缓存命中和失效。
- 导入解析和同步幂等。

## 13. 注释规范

- 不写复述代码的注释。
- 对不明显的安全边界、Cloudflare 限制、D1 约束、缓存策略可以写短注释。
- TODO 必须说明原因或后续 phase，不写空泛 TODO。

推荐：

```ts
// Production hardening should verify the Access JWT before trusting identity headers.
```

避免：

```ts
// Set name to item name.
```

## 14. 依赖规范

- 新增依赖前先确认标准库或现有依赖是否足够。
- 不为很小的工具函数新增依赖。
- 前端 UI 库、状态管理库、数据请求库需要明确收益后再引入。
- Cloudflare Workers 运行时依赖要注意包体积、Node API 兼容性和边缘运行限制。
- 新增依赖后必须确认 lockfile 变化合理。

## 15. 格式化与校验

常用命令：

```sh
corepack pnpm typecheck
corepack pnpm test
corepack pnpm lint
corepack pnpm build
corepack pnpm validate
```

说明：

- `apps/web` 当前使用 ESLint、oxlint、Prettier。
- `apps/worker` 当前 lint 主要通过 TypeScript 类型检查承载。
- `packages/shared` 当前 lint 主要通过 TypeScript 类型检查和测试承载。
- 后续如统一全仓 Prettier 或 ESLint，应单独提交工具配置，避免混入业务变更。

## 16. 提交前检查

提交前至少确认：

- 没有引入真实密码、token、API key 或 Cloudflare secret。
- 没有无关格式化。
- 没有跨越目录边界的导入。
- 相关测试已补充或说明为何不需要。
- `corepack pnpm validate` 在合理情况下通过。
- OpenSpec 相关变更已通过：

```sh
openspec validate --all --strict --no-interactive
```
