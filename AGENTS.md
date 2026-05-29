# Dockmark 协作规则

## 基本原则

- 如果用户明确说“先讨论不修改”，只讨论、只读取上下文，不修改代码或文档。
- 除非遇到需要用户定夺的重大技术路线，否则持续执行到当前任务完成。
- 创建新项目或子项目时，优先使用官方脚手架，不手写等价初始结构。
- 网络慢或超时时，可以使用 npm registry mirror；必要时可使用代理 `<local-proxy>`。

## OpenSpec

- 产品能力、阶段范围、数据模型、接口语义、安全边界发生变化时，先补 OpenSpec change，再实现。
- OpenSpec spec/change 名称必须使用阶段前缀：主阶段使用 `phase-N-*`，例如 `phase-1-service-navigation`；同一主阶段下拆出的子阶段使用 `phase-N.M-*`，例如 `phase-1.1-service-navigation-ux`、`phase-1.2-service-navigation-usability`。
- 每个主阶段只能有一个总 spec 继续使用 `phase-N-*`；后续拆分能力不要再创建多个 `phase-N-*` 同级名称。
- 不在当前 phase 内偷偷扩展后续 phase 范围；确需扩展时，先说明影响的 phase。
- 纯文档、注释、拼写、开发环境说明类变更可以不创建 OpenSpec change。

## Git

- 按 milestone 或 bug fix 拆分提交。
- 提交信息必须包含清晰摘要和变更点，使用真实换行，不使用字面量 `\n`。
- 不回滚用户已有改动；遇到同文件交叉修改时先读懂再处理。
- 如果 `git push` 超时且代理可用，可以使用 `<local-proxy>`。

## 质量门禁

- 容易被破坏、容易遗漏的行为必须补回归测试。
- 改共享类型或校验逻辑时，优先补 `packages/shared` 测试。
- 改 Worker API、D1、KV 缓存、认证边界时，优先补 `apps/worker` 测试。
- 改前端关键交互时，优先补 `apps/web` 测试。
- 合并前优先运行 `corepack pnpm validate` 和 `openspec validate --all --strict --no-interactive`。

## 安全边界

- Dockmark 不保存密码、API key、token、OTP seed、session cookie 或其他秘密。
- 账号相关内容只能保存为 Vaultwarden 查询提示或等价的 `credentialHint`。
- 生产认证必须通过 auth adapter 接入，不能把业务逻辑绑定死到 Cloudflare Access。
- D1 是事实源；KV 只能存可重建缓存。
