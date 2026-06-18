# ToolVault E2E 测试与问题修复设计

## 背景

ToolVault MVP 已包含 FastAPI 后端、React/Vite 前端、CLI 导入、Alembic 迁移、敏感信息扫描、公开/后台 API 和基础后端测试。当前后端已有 pytest 覆盖，前端已有 build/lint，但缺少可重复执行的浏览器端 E2E 测试来验证真实用户流程。

本轮目标是利用自动化工具测试完整业务链路，发现 bug 后补回归测试、修复，并记录修复过的问题。

## 目标

- 建立可重复执行的全流程 E2E 测试入口。
- 自动启动临时测试环境：SQLite 数据库、Alembic 迁移、示例数据导入、FastAPI 服务、Vite 前端。
- 用 Playwright 覆盖核心用户流程：公开浏览、详情页 Markdown、管理员登录、JSON 导入、私有内容隐藏、错误输入反馈。
- 对发现的 bug 先补失败用例，再修复，再验证。
- 维护一份问题修复记录，说明触发方式、根因、修复方式和验证证据。

## 非目标

- 不引入复杂 CI/CD 流程。
- 不做跨浏览器矩阵测试；首版只用 Chromium。
- 不做性能压测。
- 不接入真实生产 PostgreSQL；E2E 默认使用临时 SQLite，PostgreSQL 仍保留为手动/后续验证项。
- 不扩大产品功能范围，例如新增用户管理、编辑工具表单或评论系统。

## 推荐方案

采用“脚本化本地 E2E + Playwright 测试 + 问题记录”的方式。

实现上新增一个运行脚本，例如 `scripts/run-e2e.sh`：

1. 创建临时 SQLite 数据库文件。
2. 设置 `TOOLVAULT_DATABASE_URL` 指向该临时数据库。
3. 执行 Alembic 迁移。
4. 用 CLI 导入 `fixtures/sample-tool-import.json`。
5. 启动 FastAPI 后端到固定测试端口。
6. 启动 Vite 前端到固定测试端口，并设置 `VITE_API_BASE` 指向测试后端。
7. 执行 Playwright 测试。
8. 停止后台服务并清理临时数据库。

Playwright 测试放在 `frontend/e2e/toolvault.spec.ts`，覆盖真实浏览器交互，而不是直接调用内部函数。

## E2E 场景

### 公开浏览流程

- 打开首页。
- 点击“工具库”。
- 确认 `Playwright MCP` 出现在列表中。
- 点击工具卡片进入详情页。
- 确认工具状态、安装命令和 Markdown 指南内容可见。

### 后台导入流程

- 打开登录页。
- 使用 `admin` / `toolvault-admin-local` 登录。
- 确认跳转到后台工具管理页。
- 打开导入页面。
- 粘贴 `fixtures/sample-tool-import.json` 内容。
- 点击“执行导入”。
- 确认重复导入显示更新成功。

### 私有内容可见性流程

- 在后台导入一个 `visibility = login_required` 的私有工具。
- 回到公开工具库。
- 确认私有工具不出现在公开列表中。
- 进入后台工具管理页。
- 确认私有工具在后台可见。

### 错误输入流程

- 在导入页面输入无效 JSON。
- 点击“执行导入”。
- 确认页面显示导入失败提示，并且页面没有崩溃。

## Bug 修复流程

每个 E2E 发现的问题按同一流程处理：

1. 记录触发步骤和观察结果。
2. 定位根因。
3. 写最小失败测试：后端问题写 pytest，前端/E2E 问题写 Playwright 或前端测试。
4. 实现最小修复。
5. 运行相关测试和 E2E 场景确认修复。
6. 在问题记录中写明：问题、根因、修复、验证命令或浏览器观察。

## 问题记录

新增问题记录文件：

```text
docs/testing/e2e-fixes.md
```

每条记录使用固定格式：

```markdown
## YYYY-MM-DD - 问题标题

- 触发方式：用户或测试如何触发问题。
- 观察结果：实际看到什么。
- 根因：代码或配置层面的原因。
- 修复：改了什么。
- 验证：执行了哪些命令或浏览器步骤。
```

首条记录应包含此前运行时发现并修复的 CORS 问题：`127.0.0.1` 前端来源默认未被后端 CORS 允许。

## 测试命令设计

建议在根目录或前端 `package.json` 中提供清晰入口：

- 后端：`uv run --directory backend pytest -v`
- 后端 lint：`uv run --directory backend ruff check .`
- 前端 build：`npm --prefix frontend run build`
- 前端 lint：`npm --prefix frontend run lint`
- E2E：`./scripts/run-e2e.sh`

E2E 脚本应使用固定测试端口，并在端口被占用时给出明确错误，而不是静默失败。

## 成功标准

本轮完成标准：

- E2E 脚本可一键运行并退出码为 0。
- Playwright 至少覆盖公开浏览、后台登录、JSON 导入、私有内容隐藏、无效 JSON 错误反馈。
- 发现的 bug 都有对应失败用例或 E2E 覆盖。
- 修复问题记录已写入 `docs/testing/e2e-fixes.md`。
- 后端 pytest、后端 lint、前端 build、前端 lint、E2E 均通过。
- 工作区最终保持干净。

## 风险与约束

- 本地没有 Docker 时，PostgreSQL 验证无法自动完成；E2E 默认使用 SQLite 保证可重复性。
- Vite 和 FastAPI 端口可能被占用，脚本需要检测并提示。
- 浏览器测试容易受异步加载影响，测试应等待页面文本或网络状态，不使用固定 sleep。
- 管理员 token 存在 localStorage 中，E2E 可以使用真实登录流程，不直接写入 token。
- 导入测试数据不得包含真实 token、密码、cookie、私钥或云厂商密钥。
