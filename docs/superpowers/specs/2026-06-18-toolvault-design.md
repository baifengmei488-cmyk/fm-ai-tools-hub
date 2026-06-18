# ToolVault 设计文档

## 背景

ToolVault 是一个用于记录、管理和沉淀开发/测试工具知识的网站项目。首版目标是保存已安装的 Claude Code MCP、插件、skills、CLI 工具、桌面应用、数据库工具及其使用指南，并支持由 Claude 在本地生成结构化导入数据后写入数据库。

项目目录为 `/Users/baifengmei/Documents/code/toolvault`。

## 目标

- 建立一个可公开部署的网站，用于展示和管理工具知识库。
- 使用数据库存储工具、分类、标签、指南、导入记录和可见性配置。
- 首版支持 Claude 本地扫描和整理已安装内容，生成可审阅的 JSON，再导入数据库。
- 支持部分内容公开访问，部分内容登录后可见。
- 为未来将好用功能沉淀为 skill 或 runbook 预留扩展点。

## 非目标

首版不做以下能力：

- 多用户注册。
- 评论系统。
- Web 服务直接扫描本机 Claude 配置或系统目录。
- 自动发布 skill。
- 复杂角色权限矩阵。
- 外部全文搜索引擎。
- 存储真实 token、密码、cookie、私钥或云厂商密钥。

## 推荐技术栈

- 前端：React + Vite + Tailwind CSS。
- 后端：FastAPI。
- 数据库：PostgreSQL。
- ORM：SQLAlchemy 2.x 或 SQLModel。
- 迁移：Alembic。
- 本地/部署编排：Docker Compose。
- 测试：pytest、前端轻量组件测试、Playwright 或 Playwright MCP。

## 整体架构

项目分为四层：

1. 前端站点
   - 提供公开页面：工具列表、分类浏览、工具详情、使用指南。
   - 提供登录后台：工具管理、指南管理、分类标签管理、导入管理。

2. 后端 API
   - 负责认证、工具数据 CRUD、导入 JSON、Markdown 指南存储、查询筛选。
   - 首版只需要单管理员登录，不开放注册。

3. 数据库
   - 保存工具、分类、标签、指南、导入批次、可见性、skill/runbook 候选标记。
   - 使用 Alembic 管理 schema 变更。

4. Claude 导入管道
   - Claude 在本地收集 MCP、插件、skills、CLI 工具和 Markdown 指南信息。
   - Claude 生成标准 JSON 预览文件。
   - 用户审阅后，通过后端导入接口或 CLI 写入数据库。

核心边界：网站负责存储、展示、编辑；Claude 负责扫描、整理和生成导入数据。

## 数据模型

### tools

保存工具、插件、MCP、skill 的主体信息。

建议字段：

- `id`
- `name`
- `slug`
- `type`：`mcp`、`plugin`、`skill`、`cli_tool`、`desktop_app`、`database` 等。
- `status`：`installed`、`configured`、`pending_config` 等。
- `summary`
- `homepage_url`
- `install_command`
- `verify_command`
- `visibility`：`public` 或 `login_required`。
- `is_skill_candidate`
- `is_runbook_candidate`
- `created_at`
- `updated_at`

### tool_guides

保存工具相关 Markdown 指南。一种工具可以有多篇指南。

建议字段：

- `id`
- `tool_id`
- `title`
- `content_markdown`
- `guide_type`：`usage`、`install`、`testing`、`runbook_draft` 等。
- `visibility`
- `created_at`
- `updated_at`

### categories 和 tags

- `categories` 保存主分类，例如“测试工具”“开发工具”“MCP”“规格驱动开发”。
- `tags` 保存灵活标签，例如 `playwright`、`database`、`automation`、`security`。
- 工具和标签使用多对多关联表。
- 工具可以属于一个或多个分类，首版可先支持一个主分类，后续再扩展多分类。

### imports

记录每次 Claude 导入。

建议字段：

- `id`
- `source`：例如 `claude_local_scan`。
- `status`：`previewed`、`imported`、`failed`。
- `summary`
- `raw_payload`
- `created_at`

### users

首版只做单管理员，但保留用户表。

建议字段：

- `id`
- `username`
- `password_hash`
- `role`
- `created_at`
- `updated_at`

### skill/runbook 扩展

首版不单独建复杂表，先在 `tools` 中使用：

- `is_skill_candidate`
- `is_runbook_candidate`

后续真正实现 skill/runbook 生成时，再增加专门表。

## Claude 导入流程

导入采用“先预览、再入库”的两阶段流程。

### 阶段 1：本地扫描与整理

Claude 在本地根据授权读取：

- `claude mcp list` / `claude mcp get <name>`。
- `claude plugin list`。
- Superpowers skills 目录。
- 已安装 CLI 工具版本，例如 OpenSpec、Spec Kit、uv。
- 已有 Markdown 指南，例如 `开发工具使用指南.md`、`MCP测试工具使用指南.md`。

Claude 不直接写库，而是生成标准导入文件。

### 阶段 2：生成导入预览

预览文件建议路径：

```text
imports/toolvault-import-preview.json
```

示例结构：

```json
{
  "source": "claude_local_scan",
  "generated_at": "2026-06-18T00:00:00+08:00",
  "tools": [
    {
      "name": "Playwright MCP",
      "slug": "playwright-mcp",
      "type": "mcp",
      "status": "configured",
      "summary": "用于浏览器自动化和 E2E 测试",
      "visibility": "public",
      "categories": ["测试工具", "MCP"],
      "tags": ["playwright", "browser", "e2e"],
      "guides": [
        {
          "title": "使用指南",
          "guide_type": "usage",
          "content_markdown": "..."
        }
      ]
    }
  ]
}
```

用户确认预览文件无敏感信息后再导入。

### 阶段 3：导入数据库

导入可通过 CLI 或后端接口实现。

CLI 示例：

```bash
python -m backend.import_tools imports/toolvault-import-preview.json
```

API 示例：

```http
POST /api/admin/imports/tools
```

后端按 `slug` 做 upsert：

- 已存在工具：更新基础信息和指南内容。
- 不存在工具：创建新工具。
- 分类和标签自动补齐。
- 每次导入写入 `imports` 记录。

### 阶段 4：后台人工修订

导入完成后，管理员可以：

- 修改分类和标签。
- 调整公开/登录可见性。
- 补充使用示例。
- 标记 skill/runbook 候选。

## 页面和功能模块

### 公开页面

1. 首页
   - 展示工具总数、主要分类、最近更新工具。
   - 简要说明网站是开发/测试工具知识库。

2. 工具列表页
   - 按类型筛选：MCP、Claude 插件、Skill、CLI 工具、桌面应用、数据库/服务。
   - 按分类、标签、状态筛选。
   - 支持关键词搜索。

3. 工具详情页
   - 展示工具名称、类型、状态、简介、安装/验证命令、Markdown 指南、标签和分类。
   - 登录可见内容对未登录用户隐藏。

4. 指南页
   - 首版可以先合并在工具详情页。
   - 后续再扩展独立指南中心。

### 登录后台

1. 登录页
   - 单管理员账号。
   - 不开放注册。

2. 工具管理
   - 新增、编辑、删除工具。
   - 修改类型、状态、可见性。
   - 标记 skill/runbook 候选。

3. 指南管理
   - Markdown 编辑工具指南。
   - 支持一种工具多篇指南。

4. 分类和标签管理
   - 创建分类。
   - 合并或删除标签。
   - 给工具绑定标签。

5. 导入管理
   - 上传 Claude 生成的 JSON。
   - 显示导入预览。
   - 执行导入。
   - 查看导入历史和结果。

## 权限和安全

### 可见性模型

每个工具和每篇指南支持：

- `public`：公开访问。
- `login_required`：登录后可见。

首版权限：

- 未登录访客只能看公开内容。
- 管理员可以看和编辑全部内容。

### 敏感信息处理

导入时必须遵守：

- 不导入真实 token、密码、cookie、私钥。
- 不保存真实数据库密码。
- 不保存 GitHub token、云厂商 AccessKey、PicGo 图床密钥。
- 配置说明使用占位符，例如 `YOUR_TOKEN`、`readonly_user`、`your_password`。
- 本机路径默认标记为 `login_required`。
- 导入预览阶段检查疑似敏感字段，例如 `token`、`password`、`secret`、`key`、`cookie`、`.env`。

### 后端安全

- 登录密码使用哈希存储。
- 后台接口都需要认证。
- 导入接口只允许管理员调用。
- Markdown 渲染需要 XSS 防护。
- 后端不要执行上传 JSON 中的命令字段，只作为文本保存。
- 数据库迁移和初始化不写死真实密钥。

## 测试与验证

### 后端测试

使用 `pytest` 验证：

- 工具 CRUD。
- 分类和标签关联。
- 登录后才能访问后台接口。
- 未登录不能访问私有内容。
- 导入 JSON 能创建和更新工具。
- 导入时不会执行 JSON 中的命令字段。
- 敏感字段检测能拦截明显风险内容。

### 前端测试

首版做轻量测试：

- 关键组件渲染。
- 工具列表筛选和搜索。
- 工具详情 Markdown 展示。
- 登录态和未登录态页面差异。

### 导入流程验证

准备示例导入文件：

```text
fixtures/sample-tool-import.json
```

验证：

- 新工具能入库。
- 已存在工具按 `slug` 更新。
- 分类和标签能自动创建。
- 导入历史有记录。
- 公开/登录可见性生效。
- 含疑似密钥内容时会被拒绝或标记风险。

### Playwright 浏览器验收

验证主流程：

- 打开首页。
- 搜索工具。
- 查看公开工具详情。
- 登录后台。
- 上传导入 JSON。
- 查看导入结果。
- 编辑工具指南。
- 确认未登录用户看不到私有内容。

### 完成标准

首版完成标准：

```text
后端测试通过 + 前端可启动 + Playwright 主流程可走通 + 数据库中有导入数据 + 私有内容不公开
```

## 实施顺序建议

1. 初始化项目骨架和 Docker Compose。
2. 建立 FastAPI 后端、PostgreSQL 连接和 Alembic 迁移。
3. 实现核心数据模型。
4. 实现管理员认证。
5. 实现工具、指南、分类、标签 API。
6. 实现 JSON 导入接口和导入历史。
7. 实现 React 前端公开页面。
8. 实现登录后台和导入管理。
9. 准备 Claude 导入预览数据。
10. 执行端到端验证。

## 风险与约束

- 自动导入容易误收集敏感信息，因此必须保留预览和人工确认步骤。
- 公开部署后，Web 服务不应直接扫描本机环境。
- 首版要控制范围，避免把 skill/runbook 生成器提前做复杂。
- Markdown 渲染需要处理 XSS 风险。
- 未来如果开放多用户，需要重新设计权限和审计。
