# Dockmark API 约定

本文档定义 Dockmark Worker API 的命名、鉴权、输入输出和错误处理约定。

## 1. 路由命名

- 所有业务 API 使用 `/api/*` 前缀。
- 集合资源使用复数名词，例如 `/api/items`、`/api/categories`、`/api/tags`。
- 资源详情使用 `/:id`，例如 `/api/items/:id`。
- 读操作使用 `GET`。
- 创建使用 `POST`。
- 更新使用 `PATCH`。
- 删除使用 `DELETE`。

## 2. 鉴权约定

- 写操作默认必须鉴权。
- 管理类读操作原则上也应鉴权；如需公开读取，必须在 OpenSpec 或 design 中说明原因。
- 业务代码只消费标准用户上下文，不直接依赖 Cloudflare Access header。
- 新认证方式必须通过 auth adapter 接入。

当前阶段允许：

- 本地开发使用 `AUTH_MODE=development`。
- 生产使用 `AUTH_MODE=builtin`。

禁止：

- 在生产环境使用 development auth。
- 在业务 route 中直接解析生产认证 provider 的私有 header。

## 3. 字段命名

- API 请求和响应使用 camelCase。
- 数据库字段使用 snake_case。
- 数据库 row 到 API object 的转换集中在 Worker 映射层处理。

示例：

```ts
{
  "categoryId": "cat_xxx",
  "credentialHint": "Vaultwarden search Immich",
  "sortOrder": 0
}
```

## 4. 响应结构

列表接口返回命名集合：

```json
{
  "items": []
}
```

详情或创建接口返回命名单个资源：

```json
{
  "item": {}
}
```

删除成功返回 `204 No Content`。

导航聚合接口可以返回直接可渲染结构，例如 `/api/nav`：

```json
{
  "categories": [],
  "uncategorized": []
}
```

## 5. 错误结构

建议逐步统一为：

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "exactly one endpoint must be primary",
    "details": []
  }
}
```

推荐错误码：

- `BAD_REQUEST`：请求格式错误。
- `VALIDATION_FAILED`：输入校验失败。
- `AUTHENTICATION_REQUIRED`：未登录。
- `FORBIDDEN`：无权限。
- `NOT_FOUND`：资源不存在。
- `CONFLICT`：唯一性或状态冲突。
- `INTERNAL_ERROR`：服务端未知错误。

当前代码仍有部分接口返回纯文本错误。后续涉及 API 兼容性调整时，应把错误响应统一纳入对应 phase 或单独 OpenSpec change。

## 6. 输入校验

- 前后端共享的输入结构和校验优先放在 `packages/shared`。
- Worker route 必须调用校验函数，不信任前端输入。
- 校验失败返回 400。
- URL 必须使用标准 URL parser 校验，不使用手写正则作为唯一判断。
- 涉及秘密字段时必须拒绝，例如：
  - `password`
  - `token`
  - `apiKey`
  - `otpSeed`
  - `sessionCookie`

## 7. 数据写入

- 所有 D1 写入必须使用 prepared statement 和参数绑定。
- 一个业务写操作涉及多个表时，应确保最终状态一致。
- 写入 categories、items、endpoints、tags、item_tags 后，必须使导航缓存失效。
- 删除资源要依赖 D1 外键和级联规则，同时用测试覆盖关键行为。

## 8. 缓存约定

- KV 只缓存可重建数据。
- `/api/nav` 使用版本化 key 或等价确定性策略。
- 写操作不依赖 KV 删除通配符；优先递增版本或写入新 key。
- 缓存 miss 时从 D1 重建。
- D1 返回的数据始终比 KV 更权威。

## 9. 分页与搜索

后续列表数据变大时，新增接口应优先采用显式参数：

```text
?q=immich&limit=50&cursor=...
```

约定：

- `q` 表示搜索关键词。
- `limit` 必须有上限。
- `cursor` 用于游标分页。
- 排序字段必须白名单化，不能直接透传 SQL 片段。

## 10. 版本兼容

当前 API 不引入 `/api/v1` 前缀。若未来浏览器扩展开始依赖稳定远程 API，再评估版本化策略。

原则：

- Web UI 和 Worker 同仓发布时，可以保持轻量 API。
- 浏览器扩展、第三方客户端、导入导出格式一旦稳定，应明确兼容策略。
