# ToolVault 技术架构文档

## 1. 架构总览

ToolVault / FM AI Tools Hub 是一个前后端分离的 local-first 工具知识库项目。系统核心边界是：Claude 在本地负责扫描、研究和生成经过审阅的 JSON payload；Web 应用负责存储、展示、导入和追踪更新记录。

```text
Claude / 本地资料整理
        │
        ▼
reviewed JSON payload
        │
        ▼
FastAPI 后端 ── SQLAlchemy/Alembic ── SQLite 或 PostgreSQL
        │
        ▼
React + Vite 前端
        │
        ▼
公开页面、后台导入、更新日志、About FM 页面
```

项目目录主要分为：

- `frontend/`：React 前端应用。
- `backend/`：FastAPI 后端、数据库模型、导入服务和 CLI。
- `imports/`：经过审阅的导入 payload 和页面刷新清单。
- `docs/`：项目文档、需求文档、架构文档、测试记录和历史规格/计划。
- `fixtures/`：测试和示例导入数据。
- `scripts/`：本地验证和 E2E 辅助脚本。

## 2. 前端架构

### 2.1 应用入口和路由

前端入口位于 `frontend/src/main.tsx`，应用路由集中在 `frontend/src/App.tsx`。当前主要路由包括：

- `/`：首页。
- `/tools`：工具库列表页。
- `/tools/:slug`：工具详情页。
- `/workflows`：工作流、提示词、命令速查聚合页。
- `/prompts`：旧入口，重定向到 `/workflows?tab=prompts`。
- `/commands`：旧入口，重定向到 `/workflows?tab=commands`。
- `/guides`：工具使用导航页。
- `/updates`：更新日志页。
- `/about`：About FM 个人主页。
- `/login`：后台登录页。
- `/admin/tools`：后台工具列表。
- `/admin/imports`：后台 JSON 导入页。

`frontend/src/components/Layout.tsx` 提供统一 shell、顶部导航和页面出口。About FM 页面虽然视觉风格更独立，但仍挂在同一个路由和布局体系内。

### 2.2 API client

`frontend/src/api/client.ts` 定义前端调用后端 API 的类型和通用请求函数：

- `Tool`、`Guide`、`PageContent`、`UpdateLogEntry` 等响应类型。
- `apiGet`、`apiPost` 通用请求封装。
- `login` 登录请求。
- `getStoredToken`、`storeToken` 管理本地 token。

API base 由 `VITE_API_BASE` 控制，默认是 `http://127.0.0.1:8000`。

### 2.3 页面层

页面级组件集中在 `frontend/src/pages/`：

- `HomePage.tsx`：首页推荐内容。
- `ToolListPage.tsx`：工具库列表和类型筛选。
- `ToolDetailPage.tsx`：工具详情、安装验证和 Markdown 指南。
- `WorkflowPage.tsx`：工作流、提示词、命令速查 tab。
- `GuideNavigationPage.tsx`：工具使用导航和安全提示。
- `UpdateLogPage.tsx`：导入更新日志。
- `AboutPage.tsx`：个人作品集式 About FM 页面。
- `LoginPage.tsx`、`pages/admin/*`：后台登录和导入管理。

可复用组件集中在 `frontend/src/components/`，例如：

- `ToolIcon.tsx`：工具图标展示。
- `ToolLink.tsx`、`ToolRefLink.tsx`：工具引用链接。

### 2.4 Markdown 和内容安全

工具指南使用 Markdown 内容展示。前端依赖 `react-markdown` 和 `rehype-sanitize`，目标是把导入内容作为数据渲染，而不是执行不可信 HTML 或脚本。

内容安全的关键原则：

- 工具指南来自 reviewed JSON，不直接从用户输入实时执行。
- Markdown 渲染要过滤危险 HTML。
- command 字段只展示，不在前端或后端自动执行。

### 2.5 E2E 覆盖

Playwright E2E 测试位于 `frontend/e2e/toolvault.spec.ts`，覆盖：

- 首页推荐卡片交互。
- 公开工具库和工具详情页。
- 工作流、提示词、命令 tab。
- 更新日志展开和字段级更新内容。
- 指南页和旧入口重定向。
- About FM 页面内容和隐私约束。
- 工具类型筛选。
- 后台登录和 JSON 导入。
- login_required 内容公开隐藏、后台可见。
- 非法导入 JSON 错误提示。

E2E 的一个重要职责是防止新增功能后把已有工具、页面内容或更新日志清空。

## 3. 后端架构

### 3.1 FastAPI 应用入口

后端入口是 `backend/app/main.py`：

- 创建 `FastAPI(title="FM AI Tools Hub API")`。
- 配置 CORS，来源由 `settings.cors_origin_list` 控制。
- 注册认证、公开工具、后台工具、导入、更新日志、页面内容等 router。
- 提供 `/api/health` 健康检查。

### 3.2 路由层

后端路由位于 `backend/app/api/routes/`：

- `auth.py`：管理员登录和 token 签发。
- `public_tools.py`：公开工具列表、工具详情等公开接口。
- `admin_tools.py`：后台工具管理接口。
- `imports.py`：后台导入接口。
- `page_content.py`：页面内容接口。
- `update_logs.py`：更新日志接口。

路由层负责 HTTP 请求/响应组织，不承载复杂业务逻辑。

### 3.3 依赖与配置

- `backend/app/api/deps.py`：数据库 session、当前用户等 FastAPI dependency。
- `backend/app/core/config.py`：环境变量、数据库 URL、CORS、管理员配置。
- `backend/app/core/database.py`：SQLAlchemy engine、session 和 Base。
- `backend/app/core/security.py`：密码校验、token 等安全相关工具。

### 3.4 Schema 层

Pydantic schema 位于 `backend/app/schemas/`：

- `auth.py`：登录请求和 token 响应。
- `tool.py`：工具、分类、标签、指南响应。
- `import_payload.py`：导入 payload 的严格结构。
- `page_content.py`：页面内容结构。
- `update_log.py`：更新日志结构。

导入 payload 使用 `extra="forbid"` 的严格校验策略，避免未定义字段悄悄进入系统。

### 3.5 Model 层

SQLAlchemy model 位于 `backend/app/models/`：

- `tool.py`：工具主体。
- `guide.py`：工具指南。
- `taxonomy.py`：分类、标签和关联关系。
- `import_batch.py`：导入批次、raw payload 和执行报告。
- `user.py`：管理员用户。
- `base.py`：通用模型基础。

Model 层只描述持久化结构，不处理导入合并和敏感扫描业务。

### 3.6 Service 层

业务逻辑主要在 `backend/app/services/`：

- `import_tools.py`：payload 预览、工具 upsert、页面内容合并、更新日志详情生成。
- `sensitive_scan.py`：敏感内容扫描。

`import_tools.py` 中的重要职责包括：

- 根据 payload 统计工具、分类、标签和指南数量。
- 查找敏感内容。
- 按 slug 创建或更新工具。
- 合并 `page_content`，避免完整历史内容被短样例覆盖。
- 生成 `content_plan`、`sources`、`changes`、`change_details`。
- 写入 `ImportBatch`。

## 4. 数据库与迁移

### 4.1 数据库选择

项目支持本地 SQLite 和 PostgreSQL 验证：

- SQLite 适合本地快速开发、E2E 临时数据库和轻量验证。
- PostgreSQL 用于更接近部署环境的运行时验证。

数据库 URL 由 `TOOLVAULT_DATABASE_URL` 控制。

### 4.2 Alembic 迁移

迁移配置位于 `backend/alembic.ini` 和 `backend/alembic/`。本地运行迁移命令：

```bash
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault \
  uv run --directory backend alembic upgrade head
```

迁移负责维护 tools、guides、taxonomy、imports、users 等表结构。

### 4.3 数据保护重点

- 不应把本地 `backend/toolvault.db` 当作普通源代码清理。
- 不应在未备份和未确认的情况下删除数据库文件。
- 导入逻辑应保护历史 `page_content`，避免短 payload 覆盖完整页面内容。

## 5. 导入与更新日志流程

### 5.1 reviewed JSON payload

主要导入文件位于 `imports/toolvault-import-preview.json`，页面刷新清单位于 `imports/page-content-plan.json`。

payload 主要包含：

- `source`：导入来源标识。
- `generated_at`：资料生成时间。
- `tools`：工具主体、分类、标签和指南。
- `content_plan`：页面路径和栏目刷新要求。
- `sources`：公开或授权资料来源。
- `changes`：更新摘要。
- `change_details`：字段级变更。
- `page_content`：首页、工作流、提示词、命令、指南等页面内容。

### 5.2 后台导入

后台导入页位于 `/admin/imports`。管理员粘贴 reviewed JSON 后，前端调用后端导入接口。后端执行：

1. JSON schema 校验。
2. 敏感内容扫描。
3. 工具、分类、标签、指南 upsert。
4. 页面内容合并。
5. 写入 import batch 和更新日志。
6. 返回导入结果。

### 5.3 CLI 导入

CLI 入口包括：

- `backend/app/cli/import_tools.py`
- `backend/app/cli/daily_update.py`

常用命令：

```bash
uv run --directory backend python -m app.cli.import_tools ../fixtures/sample-tool-import.json
```

每日/每周刷新流程使用：

```bash
uv run --directory backend python -m app.cli.daily_update \
  --payload ../imports/toolvault-import-preview.json \
  --content-plan ../imports/page-content-plan.json \
  --scan-installed
```

`daily_update.py` 可以扫描本机 Claude MCP 和 plugin 列表，并把检测到的工具与 payload/database 做对比。扫描结果只应记录工具名、slug、类型、状态和安全摘要，不应复制密钥、cookie 或私有配置。

### 5.4 更新日志

更新日志由导入批次中的 raw payload 和执行报告生成，前端 `/updates` 页面展示：

- 导入来源。
- 更新时间。
- 验证状态。
- 执行报告。
- 影响工具。
- content plan。
- sources。
- changes 和 change_details。

字段级变更建议尽量包含：

- `page_path`
- `section`
- `tool_slug`
- `field`
- `change_type`
- `before`
- `after`
- `source_titles`

## 6. 安全边界

### 6.1 敏感内容

系统不得写入或展示真实：

- API keys
- tokens
- cookies
- passwords
- private keys
- 生产连接串
- 私有内部 URL
- 客户数据或内部资料

### 6.2 命令字段

导入 payload 中的 `install_command`、`verify_command` 和指南里的命令只用于展示和人工参考。后端不会自动执行这些命令。

### 6.3 本机扫描边界

Web 服务不扫描本机 Claude 配置、MCP 设置或系统目录。需要扫描本机工具时，只由明确的本地 CLI 流程执行，并且输出必须脱敏。

### 6.4 可见性边界

工具和指南通过 `visibility` 区分公开内容和登录可见内容：

- `public`：公开页面可见。
- `login_required`：公开页面隐藏，后台登录后可见。

公开 API 必须过滤 login_required 内容。

## 7. 本地运行与端口

默认端口：

- 后端 API：`http://127.0.0.1:8000`
- 前端 Vite：`http://127.0.0.1:5173`
- PostgreSQL：`localhost:5433`

如果端口被占用，应优先选择新的本地端口并显式设置环境变量，不要直接杀掉未知进程。

前端连接后端使用：

```bash
VITE_API_BASE=http://127.0.0.1:8000 npm --prefix frontend run dev -- --host 127.0.0.1 --port 5173
```

后端 CORS 来源由 `TOOLVAULT_CORS_ORIGINS` 控制。使用非默认前端端口时，需要把对应 origin 加入 CORS 配置。

## 8. 测试与质量门禁

### 8.1 后端测试

```bash
uv run --directory backend pytest -q
uv run --directory backend ruff check .
```

后端测试覆盖配置、认证、导入服务、敏感扫描、页面内容 API、更新日志 API 等。

### 8.2 前端构建与 lint

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
```

### 8.3 浏览器 E2E

```bash
./scripts/run-e2e.sh
```

E2E 使用临时数据库和临时服务，重点验证公开浏览、后台导入、更新日志、About 页面和内容保护。

### 8.4 PostgreSQL 验证

```bash
./scripts/verify-postgres.sh
```

该脚本验证 PostgreSQL 服务、迁移、示例导入和核心 API。

## 9. 已知风险与维护建议

### 9.1 内容被短 payload 覆盖

风险：测试样例或局部导入 payload 可能覆盖完整页面内容。

建议：

- 导入前确认 payload 的 `page_content` 完整。
- 保留 E2E 中对 `/api/tools`、`/api/page-content`、`/api/update-logs` 非空的检查。
- 更新内容时优先增量合并，不要用短样例替换完整历史内容。

### 9.2 本地文件误提交

风险：日志、数据库、工具运行态目录、系统文件误入 git。

建议：

- 使用 `.gitignore` 管控日志、缓存和系统文件。
- 对 `backend/toolvault.db`、`.claude/`、`.playwright-mcp/`、`.superpowers/` 等本地状态保持谨慎。
- 删除或归档前先看 `docs/CLEANUP-CANDIDATES.md` 并获得用户确认。

### 9.3 文档和代码不同步

风险：PRD、架构文档、README 和实际路由/API 演进后不一致。

建议：

- 每次新增页面、API、导入字段或测试流程时，同步检查 `README.md`、`docs/PRD.md` 和 `docs/ARCHITECTURE.md`。
- 更新导入流程时同步补充更新日志字段说明。

### 9.4 敏感内容泄露

风险：导入 payload、截图、文档或 fixtures 中出现真实密钥或内部资料。

建议：

- 导入前必须经过敏感内容扫描。
- 文档只写结构、流程和示例，不写真实凭据。
- 对来源不明确的资料，宁可写 baseline guide，也不要复制不确定的私有内容。
