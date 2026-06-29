# ToolVault 公网部署说明（Render）

本文说明如何把 ToolVault / FM AI Tools Hub 部署到 Render，拿到可公开访问的外网地址。Render 会为前端和后端分别生成公网 URL；前端 URL 可以直接发给别人访问。

## 推荐部署结构

- Render PostgreSQL：生产数据库。
- Render Web Service：FastAPI 后端 API。
- Render Static Site：Vite 前端静态站点。

仓库中的 `render.yaml` 提供 Blueprint 基础配置。它不会写入生产密码、数据库连接串或真实密钥；这些值应在 Render 控制台中填写或由 Render 自动生成。

## 创建服务

1. 在 Render 连接 GitHub 仓库。
2. 选择使用仓库根目录的 `render.yaml` 创建 Blueprint。
3. 创建时按提示填写 `sync: false` 的环境变量。
4. 等待 PostgreSQL、后端 Web Service、前端 Static Site 创建完成。

## 后端环境变量

后端服务 `toolvault-api` 需要以下变量：

| 变量 | 来源 | 说明 |
|---|---|---|
| `TOOLVAULT_DATABASE_URL` | Render PostgreSQL 自动注入 | `render.yaml` 使用 `fromDatabase` 引用数据库连接串。 |
| `TOOLVAULT_SECRET_KEY` | Render 自动生成 | 用于签发登录 token。 |
| `TOOLVAULT_ADMIN_USERNAME` | `admin` | 后台用户名，可部署后在 Render 控制台调整。 |
| `TOOLVAULT_ADMIN_PASSWORD` | 手动填写 | 后台强密码，只填在 Render 控制台。 |
| `TOOLVAULT_CORS_ORIGINS` | 手动填写 | 前端公网地址，例如 `https://你的前端服务.onrender.com`。 |

不要把 `TOOLVAULT_ADMIN_PASSWORD`、`TOOLVAULT_SECRET_KEY` 或数据库连接串写入仓库、文档、截图或聊天记录。

## 前端环境变量

前端服务 `toolvault-frontend` 需要：

| 变量 | 来源 | 说明 |
|---|---|---|
| `VITE_API_BASE` | 手动填写 | 后端公网 API 地址，例如 `https://你的后端服务.onrender.com`。 |

如果前端能打开但页面内容加载失败，优先检查 `VITE_API_BASE` 是否指向后端公网地址，以及后端 `TOOLVAULT_CORS_ORIGINS` 是否包含前端公网地址。

## 首次数据库迁移

后端服务创建后，在 Render 后端服务的 Shell 中执行：

```bash
uv run alembic upgrade head
```

该命令会在 Render PostgreSQL 中创建表结构。

## 首次导入内容

迁移完成后，在同一个 Render Shell 中执行：

```bash
uv run python -m app.cli.daily_update --payload ../imports/toolvault-import-preview.json --content-plan ../imports/page-content-plan.json
```

导入完成后，公开页面应能看到工具库、页面内容和更新日志。不要用短样例 payload 覆盖完整历史内容。

## 上线后验证

打开前端公网地址，检查：

1. 首页可以访问。
2. 工具库 `/tools` 有公开工具。
3. 工具详情页 `/tools/{slug}` 可以打开。
4. 工作流 `/workflows`、指南 `/guides`、更新日志 `/updates` 都有内容。
5. About 页面 `/about` 不显示真实姓名、电话、求职/投递措辞或简历下载入口。
6. 后台 `/login` 可以用 Render 环境变量中的管理员密码登录。
7. 浏览器控制台没有 CORS 错误。
8. 后端 `/api/health` 返回健康状态。

## 成本和限制

Render 免费服务适合先发布个人项目公网版本，但可能存在：

- 免费 Web Service 休眠，首次访问会冷启动。
- 免费 PostgreSQL 有容量或期限限制。
- 免费额度和套餐规则可能变化。

如果后续需要长期稳定在线、访问更快或绑定正式域名，再考虑升级 Render 付费档或迁移到低价 VPS。

## 安全边界

- 不使用 SQLite 作为公网长期数据库。
- 不把 CORS 设置成 `*`。
- 不把生产密钥写入 `.env.example`、README、fixtures、导入 JSON 或提交记录。
- 不删除本地 `backend/toolvault.db`、`imports/*.json`、`.claude/`、`.playwright-mcp/`、`.superpowers/`。
- 导入 payload 中的命令只展示，不会由后端自动执行。
