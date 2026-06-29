# ToolVault

ToolVault 是一个 local-first 的开发与测试工具知识库，用来沉淀工具元数据、分类、标签、Markdown 使用指南、导入历史，以及公开/登录可见性配置。Claude 负责在本地扫描和整理工具资料，生成经过审阅的 JSON 导入文件；Web 应用负责存储、展示和导入这些数据。

## 核心能力

- 公开工具库和工具详情页
- 单管理员后台登录
- Claude 生成 JSON 后的审阅导入流程
- 公开内容与登录可见内容的过滤
- 导入前敏感内容扫描
- 面向已审阅 JSON 文件的 CLI 导入命令
- 首页、工作流、提示词、命令速查、指南导航和更新日志内容展示
- Playwright E2E 覆盖主要浏览器流程

## 技术栈

- Backend：FastAPI、SQLAlchemy、Alembic、PostgreSQL、pytest、ruff
- Frontend：React、Vite、Tailwind CSS、react-markdown、rehype-sanitize
- Tooling：uv、npm、Docker Compose、Playwright

## 本地环境要求

- Python 3.12 或更高版本
- uv
- Node.js 和 npm
- Docker Desktop，或可用的 Docker CLI，用于 PostgreSQL 验证

项目曾在本地使用 Python 3.14 验证通过。

## 本地配置

复制示例环境文件：

```bash
cp .env.example .env
```

默认本地配置：

- 管理员用户名：`admin`
- 管理员密码：`toolvault-admin-local`
- PostgreSQL 本地端口：`5433`
- 前端开发服务：`http://127.0.0.1:5173`
- 后端 API：`http://127.0.0.1:8000`

不要把真实 token、密码、cookie、私钥、云访问密钥或生产连接信息写入导入 JSON、示例文件、截图或文档。

## 启动 PostgreSQL

```bash
docker compose up -d postgres
```

Compose 服务使用数据库 `toolvault`、用户 `toolvault`，并在本地 `5433` 端口提供 PostgreSQL 验证环境。

## 运行后端迁移

```bash
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault \
  uv run --directory backend alembic upgrade head
```

## 导入示例数据

```bash
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault \
  uv run --directory backend python -m app.cli.import_tools ../fixtures/sample-tool-import.json
```

首次导入时输出应包含 `created`；重复导入时通常会包含 `updated`。

## 启动后端 API

```bash
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault \
  uv run --directory backend uvicorn app.main:app --host 127.0.0.1 --port 8000
```

健康检查：

```bash
curl http://127.0.0.1:8000/api/health
```

## 启动前端

首次运行前安装依赖：

```bash
npm --prefix frontend install
```

启动 Vite：

```bash
VITE_API_BASE=http://127.0.0.1:8000 npm --prefix frontend run dev -- --host 127.0.0.1 --port 5173
```

浏览器打开 `http://127.0.0.1:5173`。

## 测试命令

后端测试与 lint：

```bash
uv run --directory backend pytest -q
uv run --directory backend ruff check .
```

前端构建与 lint：

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
```

使用临时 SQLite 数据库运行浏览器 E2E：

```bash
./scripts/run-e2e.sh
```

E2E 脚本会启动临时后端和前端，执行 Playwright 测试，并清理临时运行文件。

## PostgreSQL 验证

运行 PostgreSQL 运行时验证脚本：

```bash
./scripts/verify-postgres.sh
```

脚本会执行以下流程：

1. 启动 Docker Compose PostgreSQL 服务。
2. 等待容器变为 healthy。
3. 在 PostgreSQL 上运行 Alembic 迁移。
4. 导入 `fixtures/sample-tool-import.json`。
5. 启动临时 FastAPI API 服务。
6. 验证 `/api/health` 和 `/api/tools` 可用，并确认响应中包含 `Playwright MCP`。

该脚本不会删除 Docker volumes，也不会执行 `docker compose down -v`。

更多说明见 `docs/testing/e2e-fixes.md`。如果需要单独排查 PostgreSQL 验证流程，可补充阅读或维护 `docs/testing/postgres-verification.md`。

## 项目文档

- `docs/PRD.md`：中文 PRD/RPD 需求基线，说明项目目标、范围、场景和验收标准。
- `docs/ARCHITECTURE.md`：中文技术架构文档，说明前后端、数据库、导入流程、安全边界和测试策略。
- `docs/DEPLOYMENT.md`：Render 公网部署说明，覆盖服务创建、环境变量、迁移、导入和上线验证。
- `docs/CLEANUP-CANDIDATES.md`：待清理文件与代码候选清单，只记录建议，不直接删除。
- `docs/testing/e2e-fixes.md`：E2E 和本地调试问题记录。
- `docs/superpowers/specs/`：历史设计规格记录。
- `docs/superpowers/plans/`：历史实施计划记录。

## 安全说明

- 导入 JSON 只作为数据处理；后端不会执行 payload 中的命令字段。
- 敏感内容扫描会在导入前拒绝明显真实的密钥、token、cookie、私钥等内容。
- Web 服务不会扫描本机 Claude 配置、MCP 设置或系统目录。
- 生产密钥、真实账号凭据、私有 URL、客户数据和内部资料不得进入 `.env.example`、fixtures、导入 JSON、截图或文档。
