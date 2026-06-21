# ToolVault 项目可运行说明与 PostgreSQL 验证设计

## 背景

ToolVault MVP 已完成本地实现，包含 FastAPI 后端、React/Vite 前端、Alembic 迁移、CLI 导入、Playwright E2E 测试和 SQLite 驱动的一键 E2E 验证。当前项目缺少面向日常使用的根目录 README，也缺少可重复执行的 PostgreSQL 本地验证入口。

本轮目标是让项目从“已经实现”变成“未来可以按文档重新跑起来”，并验证 MVP 的目标数据库 PostgreSQL 路径。

## 目标

- 新增根目录 README，说明项目用途、技术栈、环境要求、启动步骤和测试命令。
- 新增 PostgreSQL 本地验证脚本，覆盖 Docker Compose PostgreSQL、Alembic 迁移、样例导入和 API 验证。
- 新增 PostgreSQL 验证记录文档，说明验证步骤、预期结果、失败排查和 Docker 不可用时的处理方式。
- 保持现有业务功能不变。

## 非目标

- 不部署到线上环境。
- 不创建远端仓库或推送代码。
- 不修改 ToolVault 数据模型或业务 API。
- 不删除或重置用户已有 Docker volume。
- 不引入复杂 CI/CD。

## README 设计

根目录新增：

```text
README.md
```

README 面向项目维护者，内容包括：

1. 项目简介
   - ToolVault 是开发/测试工具知识库。
   - 支持公开浏览、管理员登录、JSON 导入、私有内容可见性。

2. 技术栈
   - Backend：FastAPI、SQLAlchemy、Alembic、PostgreSQL、pytest、ruff。
   - Frontend：React、Vite、Tailwind、Playwright。
   - Tooling：uv、npm、Docker Compose。

3. 环境要求
   - Python 3.12+，项目当前可在 Python 3.14 环境测试通过。
   - uv。
   - Node.js/npm。
   - Docker Desktop 或可用 Docker CLI，用于 PostgreSQL 验证。

4. 本地配置
   - 复制 `.env.example` 为 `.env`。
   - 说明默认管理员：`admin` / `toolvault-admin-local`。
   - 说明默认 PostgreSQL 连接：localhost:5433。

5. 后端启动
   - 启动 PostgreSQL。
   - 执行 Alembic 迁移。
   - 导入样例数据。
   - 启动 uvicorn。

6. 前端启动
   - 安装依赖。
   - 设置 `VITE_API_BASE`。
   - 启动 Vite。

7. 测试命令
   - 后端 pytest。
   - 后端 ruff。
   - 前端 build。
   - 前端 lint。
   - E2E：`./scripts/run-e2e.sh`。

8. PostgreSQL 验证
   - 使用 `./scripts/verify-postgres.sh`。
   - 说明脚本不会删除 Docker volume。

9. 安全说明
   - 不导入真实 token、密码、cookie、私钥。
   - JSON 导入会进行敏感信息扫描。
   - Web 服务不会扫描本机 Claude 配置。

## PostgreSQL 验证脚本设计

新增：

```text
scripts/verify-postgres.sh
```

脚本职责：

1. 检查 `docker` 命令是否存在。
2. 在仓库根目录执行 `docker compose up -d postgres`。
3. 等待 PostgreSQL health 状态变为 healthy。
4. 设置：

```text
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault
```

5. 执行：

```bash
uv run --directory backend alembic upgrade head
uv run --directory backend python -m app.cli.import_tools ../fixtures/sample-tool-import.json
```

6. 启动临时 FastAPI 服务到测试端口，例如 `8130`。
7. 调用：

```text
GET /api/health
GET /api/tools
```

8. 确认响应中包含 `Playwright MCP`。
9. 停止临时 FastAPI 服务。
10. 输出明确的成功或失败信息。

脚本约束：

- 不执行 `docker compose down -v`。
- 不删除 PostgreSQL volume。
- 不依赖前端或浏览器。
- 端口占用时给出明确错误。
- Docker 不可用时退出非零状态，并提示安装/启动 Docker。

## PostgreSQL 验证记录设计

新增：

```text
docs/testing/postgres-verification.md
```

内容包括：

- 验证目标。
- 自动验证命令：`./scripts/verify-postgres.sh`。
- 手动验证步骤。
- 成功标准。
- 常见失败：Docker 不存在、Docker daemon 未启动、5433 端口被占用、迁移失败、导入被敏感扫描拒绝。
- 当前验证结果记录区，写入本轮实际运行结果。如果当前环境无法运行 Docker，也要记录阻塞原因。

## 测试与验证

本轮完成后需要运行：

```bash
uv run --directory backend pytest -q
uv run --directory backend ruff check .
npm --prefix frontend run build
npm --prefix frontend run lint
./scripts/run-e2e.sh
```

如果 Docker 可用，还运行：

```bash
./scripts/verify-postgres.sh
```

如果 Docker 不可用，不能声称 PostgreSQL 验证通过；记录为环境阻塞。

## 成功标准

- README 存在且能指导项目启动、测试和验证。
- `scripts/verify-postgres.sh` 存在且可执行。
- `docs/testing/postgres-verification.md` 存在并记录验证方式和本轮结果。
- 不修改业务功能。
- 所有非 PostgreSQL 依赖的验证命令通过。
- PostgreSQL 验证要么通过，要么记录明确环境阻塞原因。
- 工作区最终干净。
