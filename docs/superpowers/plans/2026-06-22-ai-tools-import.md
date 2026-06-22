# AI Tools Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, sanitize, import, and runtime-verify a richer ToolVault catalog of locally confirmed common AI and developer-assistant tools.

**Architecture:** Keep ToolVault product code unchanged. Use read-only local discovery commands to gather evidence, create a reviewed JSON import payload at `imports/toolvault-import-preview.json`, run the existing backend preview/sensitive scan, import with the existing CLI, then verify the running API and UI with alternate ports if needed.

**Tech Stack:** Bash/zsh discovery commands, JSON import payload, FastAPI import preview/CLI import, SQLite local verification database, React/Vite frontend, Playwright MCP browser observation.

---

## File Structure

Create or modify these files:

```text
toolvault/
  imports/toolvault-import-preview.json                 # Generated sanitized AI tools import payload
  docs/superpowers/specs/2026-06-22-ai-tools-import-design.md  # Already written design spec; leave as-is unless execution reveals a spec defect
  docs/superpowers/plans/2026-06-22-ai-tools-import.md         # This implementation plan
```

Do not modify backend or frontend source unless runtime verification reveals a product bug. This task is primarily data generation and import verification.

---

### Task 1: Gather Local AI Tool Evidence

**Files:**
- Create temporary notes only in conversation/tool output, not committed files.
- No repository file should be modified in this task.

- [ ] **Step 1: Check common CLI tools on PATH**

Run:

```bash
for cmd in claude gemini codex openai qwen aider cursor windsurf; do
  if command -v "$cmd" >/dev/null 2>&1; then
    printf '%s\t%s\n' "$cmd" "$(command -v "$cmd")"
  else
    printf '%s\t%s\n' "$cmd" "NOT_FOUND"
  fi
done
```

Expected: output lists each command with either a path or `NOT_FOUND`. Treat only commands with paths as locally confirmed CLI tools.

- [ ] **Step 2: Capture safe version output for confirmed CLI tools**

For each command found in Step 1, run the safest version command available. Start with:

```bash
claude --version || true
gemini --version || true
codex --version || true
openai --version || true
qwen --version || true
aider --version || true
cursor --version || true
windsurf --version || true
```

Expected: version text or a clean error. Do not include any credential-like output in the import payload.

- [ ] **Step 3: Gather Claude MCP metadata**

Run:

```bash
claude mcp list
```

Expected: a list of configured MCP servers. For each configured server, run:

```bash
claude mcp get <server-name>
```

Replace `<server-name>` with the exact server names from `claude mcp list`.

Expected: configuration metadata for each server. Record server purpose and safe install/verify commands only. Do not copy raw environment variable values into the import payload.

- [ ] **Step 4: Gather skill metadata without raw private config**

Run:

```bash
find /Users/baifengmei/.claude/plugins/local-superpowers-marketplace/superpowers/skills -maxdepth 2 -name SKILL.md -print
```

Expected: skill metadata files are listed. Use their frontmatter `name` and `description` to summarize grouped `Superpowers Skills`; do not create one ToolVault tool per skill.

- [ ] **Step 5: Check desktop app presence**

Run:

```bash
for app in "Cursor.app" "Windsurf.app" "Claude.app"; do
  if [ -d "/Applications/$app" ]; then
    printf '%s\t%s\n' "$app" "/Applications/$app"
  elif [ -d "$HOME/Applications/$app" ]; then
    printf '%s\t%s\n' "$app" "$HOME/Applications/$app"
  else
    printf '%s\t%s\n' "$app" "NOT_FOUND"
  fi
done
```

Expected: app paths or `NOT_FOUND`. Treat found apps as locally confirmed desktop/IDE tools.

---

### Task 2: Generate Sanitized Import Payload

**Files:**
- Create: `imports/toolvault-import-preview.json`

- [ ] **Step 1: Build the import JSON from gathered evidence**

Create `imports/toolvault-import-preview.json` with this exact top-level structure:

```json
{
  "source": "claude_local_scan",
  "generated_at": "2026-06-22T00:00:00+08:00",
  "tools": []
}
```

Then populate `tools` using only evidence from Task 1 and existing project docs. Every tool object must contain these fields:

```json
{
  "name": "Claude Code",
  "slug": "claude-code",
  "type": "cli",
  "status": "installed",
  "summary": "Anthropic 的本地 AI 编程助手 CLI，用于在项目中理解代码、编辑文件、运行验证并协作完成软件工程任务。",
  "homepage_url": "",
  "install_command": "npm install -g @anthropic-ai/claude-code",
  "verify_command": "claude --version",
  "visibility": "public",
  "is_skill_candidate": false,
  "is_runbook_candidate": true,
  "categories": ["AI 工具", "CLI 工具"],
  "tags": ["claude", "coding-agent", "cli"],
  "guides": [
    {
      "title": "使用指南",
      "guide_type": "usage",
      "visibility": "public",
      "content_markdown": "# Claude Code 使用指南\n\nClaude Code 是本地项目里的 AI 编程助手。常用流程是先在项目目录启动 Claude Code，再让它读取代码、修改文件、运行验证命令并总结结果。\n\n## 常用场景\n\n- 阅读代码结构并解释模块职责。\n- 修改已有代码、补充测试和运行验证命令。\n- 使用 MCP、skills 和项目文档完成更复杂的工作流。\n- 通过浏览器或 CLI 实际验证功能是否可用。\n\n## 验证安装\n\n```bash\nclaude --version\n```\n\n## 安全注意\n\n不要把真实 token、cookie、私钥或生产密码写入提示词、导入文件或公开文档。"
    }
  ]
}
```

Use this object as the content-quality baseline: all imported tools should have a meaningful summary, safe verify command, tags, and a guide with practical usage, verification, and safety notes.

- [ ] **Step 2: Include a richer Playwright MCP entry**

Ensure the payload contains a `Playwright MCP` object with slug `playwright-mcp` that updates the existing sample. Use this guide content or a more specific sanitized variant based on gathered MCP metadata:

```markdown
# Playwright MCP 使用指南

Playwright MCP 用于让 Claude 通过浏览器观察和操作真实网页。它适合做 UI 验证、E2E 走查、截图、表单填写、导航、控制台错误检查和网络请求检查。

## 常用能力

- 打开本地或远程页面并读取可访问性快照。
- 点击按钮、链接和表单控件。
- 填写输入框、选择下拉项、上传文件。
- 截图并把截图路径作为验证证据。
- 查看浏览器控制台错误和网络请求。

## 安装示例

```bash
claude mcp add -s user playwright -- npx -y @playwright/mcp
```

## 验证配置

```bash
claude mcp get playwright
```

## ToolVault 中的使用方式

验证前端功能时，先启动 ToolVault 后端和前端，再用 Playwright MCP 打开页面。确认列表、搜索、详情页和 Markdown 渲染都从真实页面观察到，而不是只看测试或 API 返回。

## 安全注意

不要在浏览器中输入真实生产凭证。截图前检查页面中是否展示 token、cookie 或个人敏感信息。
```

Expected: the guide is substantially longer than the old two-line sample and contains no secrets.

- [ ] **Step 3: Group skills into one or two entries**

If Superpowers skills are present, add one grouped tool entry with slug `superpowers-skills`, type `skill`, and status `configured`. The guide should summarize key workflows such as brainstorming, systematic debugging, TDD, verification-before-completion, writing-plans, and executing-plans. Do not create one ToolVault tool per skill.

- [ ] **Step 4: Add confirmed CLI and desktop tools only**

For each locally confirmed tool from Task 1, add an entry with stable slug:

- `gemini-cli` for `gemini`
- `codex-cli` for `codex`
- `openai-cli` for `openai`
- `qwen-cli` for `qwen`
- `aider` for `aider`
- `cursor` for Cursor app/CLI
- `windsurf` for Windsurf app/CLI
- `claude-desktop` for Claude Desktop

Expected: a tool marked `installed` has evidence from PATH or app location. A tool not confirmed locally should be omitted unless explicitly represented as `available` with a guide that says it was not confirmed installed.

- [ ] **Step 5: Validate JSON syntax**

Run:

```bash
python3 -m json.tool imports/toolvault-import-preview.json >/tmp/toolvault-import-preview.pretty.json
```

Expected: command exits `0`. If it fails, fix the JSON syntax before continuing.

---

### Task 3: Run Sensitive Preview Before Import

**Files:**
- Read: `imports/toolvault-import-preview.json`
- No source file modifications expected.

- [ ] **Step 1: Run backend preview through the real schema and scanner**

Run from the repository root:

```bash
TOKEN=$(uv run --directory backend python - <<'PY'
from app.core.security import create_access_token
from app.core.config import settings
print(create_access_token(settings.admin_username))
PY
)
TOOLVAULT_DATABASE_URL=sqlite+pysqlite:////tmp/toolvault-preview-only.db uv run --directory backend python - <<'PY'
import json
from pathlib import Path
from app.schemas.import_payload import ToolImportPayload
from app.services.import_tools import preview_tool_payload
payload = ToolImportPayload.model_validate(json.loads(Path('../imports/toolvault-import-preview.json').read_text(encoding='utf-8')))
preview = preview_tool_payload(payload)
print(json.dumps(preview.model_dump(), ensure_ascii=False, indent=2))
if preview.sensitive_findings:
    raise SystemExit(1)
PY
```

Expected: JSON output reports `sensitive_findings: []` and exits `0`. The `TOKEN` variable is not used for import; it only confirms auth helpers can load if needed. Do not proceed if this step exits non-zero.

- [ ] **Step 2: Inspect generated payload for accidental private paths or secrets**

Run:

```bash
rg -n "Bearer|token|api[_-]?key|password|passwd|secret|cookie|PRIVATE KEY|github_pat_|gh[pousr]_" imports/toolvault-import-preview.json || true
```

Expected: no real credential values. Placeholder text such as `YOUR_TOKEN` is acceptable only if the import preview also passed.

---

### Task 4: Import Into a Verification Database

**Files:**
- Read: `imports/toolvault-import-preview.json`
- Create temporary SQLite database outside the repository.

- [ ] **Step 1: Create and migrate a temporary verification database**

Run:

```bash
DB_PATH=$(mktemp -t toolvault-ai-tools-XXXXXX.db)
printf '%s\n' "$DB_PATH" > /tmp/toolvault-ai-tools-db-path.txt
TOOLVAULT_DATABASE_URL="sqlite+pysqlite:///$DB_PATH" uv run --directory backend alembic upgrade head
```

Expected: Alembic applies the current schema successfully.

- [ ] **Step 2: Import the generated payload**

Run:

```bash
DB_PATH=$(cat /tmp/toolvault-ai-tools-db-path.txt)
TOOLVAULT_DATABASE_URL="sqlite+pysqlite:///$DB_PATH" uv run --directory backend python -m app.cli.import_tools ../imports/toolvault-import-preview.json
```

Expected: output JSON reports `created` greater than `1` on a fresh database, `updated` may be `0`.

- [ ] **Step 3: Query imported tool count through the public API layer**

Run:

```bash
DB_PATH=$(cat /tmp/toolvault-ai-tools-db-path.txt)
TOOLVAULT_DATABASE_URL="sqlite+pysqlite:///$DB_PATH" uv run --directory backend python - <<'PY'
from app.core.database import SessionLocal
from app.api.routes.public_tools import list_public_tools
with SessionLocal() as session:
    tools = list_public_tools(db=session)
print(len(tools))
print('\n'.join(tool.name for tool in tools))
if len(tools) <= 1:
    raise SystemExit(1)
PY
```

Expected: prints multiple tool names and exits `0`.

---

### Task 5: Runtime Verify API and Browser UI

**Files:**
- Read: `imports/toolvault-import-preview.json`
- Existing frontend/backend code should not change.

- [ ] **Step 1: Start the backend on an alternate free port**

Run:

```bash
lsof -nP -iTCP:8133 -sTCP:LISTEN >/dev/null 2>&1 && { echo 'Port 8133 is in use'; exit 1; }
DB_PATH=$(cat /tmp/toolvault-ai-tools-db-path.txt)
BACKEND_LOG=$(mktemp -t toolvault-ai-tools-backend-XXXXXX.log)
printf '%s\n' "$BACKEND_LOG" > /tmp/toolvault-ai-tools-backend-log.txt
TOOLVAULT_DATABASE_URL="sqlite+pysqlite:///$DB_PATH" TOOLVAULT_CORS_ORIGINS="http://localhost:5175,http://127.0.0.1:5175" uv run --directory backend uvicorn app.main:app --host 127.0.0.1 --port 8133 >"$BACKEND_LOG" 2>&1 &
echo $! > /tmp/toolvault-ai-tools-backend.pid
```

Expected: command backgrounds the backend and writes a PID file.

- [ ] **Step 2: Wait for backend readiness and inspect API output**

Run:

```bash
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8133/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
curl -fsS http://127.0.0.1:8133/api/tools >/tmp/toolvault-ai-tools-api.json
python3 - <<'PY'
import json
from pathlib import Path
tools = json.loads(Path('/tmp/toolvault-ai-tools-api.json').read_text())
print(len(tools))
print('\n'.join(tool['name'] for tool in tools))
if len(tools) <= 1:
    raise SystemExit(1)
PY
```

Expected: the API returns multiple public tools and exits `0`.

- [ ] **Step 3: Start frontend on an alternate free port**

Run:

```bash
lsof -nP -iTCP:5175 -sTCP:LISTEN >/dev/null 2>&1 && { echo 'Port 5175 is in use'; exit 1; }
FRONTEND_LOG=$(mktemp -t toolvault-ai-tools-frontend-XXXXXX.log)
printf '%s\n' "$FRONTEND_LOG" > /tmp/toolvault-ai-tools-frontend-log.txt
VITE_API_BASE="http://127.0.0.1:8133" npm --prefix frontend run dev -- --host 127.0.0.1 --port 5175 >"$FRONTEND_LOG" 2>&1 &
echo $! > /tmp/toolvault-ai-tools-frontend.pid
```

Expected: command backgrounds the frontend and writes a PID file.

- [ ] **Step 4: Wait for frontend readiness**

Run:

```bash
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:5175 >/dev/null 2>&1; then
    exit 0
  fi
  sleep 0.5
done
echo 'Frontend did not become ready'
cat "$(cat /tmp/toolvault-ai-tools-frontend-log.txt)"
exit 1
```

Expected: command exits `0`.

- [ ] **Step 5: Browser-verify the tool list**

Use Playwright MCP to navigate to:

```text
http://127.0.0.1:5175/tools
```

Expected observations:

- The page heading is `工具库`.
- Multiple AI tool cards are visible.
- `Playwright MCP` is visible.
- `Claude Code` or another confirmed Claude-related entry is visible.

Save a full-page screenshot as:

```text
toolvault-ai-tools-list.png
```

- [ ] **Step 6: Browser-verify search behavior**

In the search box, search representative confirmed terms:

```text
Claude
Gemini
Cursor
```

Expected: each term that was confirmed locally returns at least one matching entry. If `Gemini` or `Cursor` was not locally confirmed and omitted from the payload, record that the term was skipped because it was not confirmed installed.

- [ ] **Step 7: Browser-verify details and Markdown guides**

Open these detail pages when present:

```text
/tools/playwright-mcp
/tools/claude-code
```

Also open one additional imported tool detail page.

Expected observations:

- `Playwright MCP` guide contains sections such as `常用能力`, `安装示例`, and `安全注意`.
- `Claude Code` guide contains practical usage and verification instructions.
- One additional guide renders Markdown headings and code blocks correctly.

Save one representative detail screenshot as:

```text
toolvault-ai-tool-detail.png
```

- [ ] **Step 8: Stop temporary servers**

Run:

```bash
if [ -f /tmp/toolvault-ai-tools-frontend.pid ]; then kill "$(cat /tmp/toolvault-ai-tools-frontend.pid)" 2>/dev/null || true; fi
if [ -f /tmp/toolvault-ai-tools-backend.pid ]; then kill "$(cat /tmp/toolvault-ai-tools-backend.pid)" 2>/dev/null || true; fi
```

Expected: temporary frontend and backend are stopped. Do not stop unrelated processes.

---

### Task 6: Final Review and Optional Commit

**Files:**
- Created: `imports/toolvault-import-preview.json`
- Created: `docs/superpowers/specs/2026-06-22-ai-tools-import-design.md`
- Created: `docs/superpowers/plans/2026-06-22-ai-tools-import.md`
- Created screenshots may remain untracked unless the user wants them committed.

- [ ] **Step 1: Inspect git status**

Run:

```bash
git status --short
```

Expected: shows the new import JSON, design spec, plan, and any screenshots. Existing unrelated untracked files such as `.claude/` or `.playwright-mcp/` should not be committed unless the user explicitly asks.

- [ ] **Step 2: Inspect payload diff**

Run:

```bash
git diff -- imports/toolvault-import-preview.json docs/superpowers/specs/2026-06-22-ai-tools-import-design.md docs/superpowers/plans/2026-06-22-ai-tools-import.md
```

Expected: reviewable data and docs only, no secrets.

- [ ] **Step 3: Ask before committing**

Do not commit unless the user explicitly asks. If the user asks to commit, stage only these files unless they request screenshots too:

```bash
git add imports/toolvault-import-preview.json docs/superpowers/specs/2026-06-22-ai-tools-import-design.md docs/superpowers/plans/2026-06-22-ai-tools-import.md
git commit -m "data: add AI tools import preview"
```

Expected: commit succeeds and does not include `.claude/`, `.playwright-mcp/`, or generated screenshots unless explicitly requested.

---

## Self-Review

Spec coverage:

- Reviewed sanitized import goal: Tasks 1-3.
- No web-service local scanning: Plan only uses one-time local discovery and import JSON; no backend/frontend source changes.
- Common AI tooling scope: Task 1 and Task 2.
- Safety and sanitization: Task 3.
- Existing data model and stable slugs: Task 2.
- Import and runtime verification: Tasks 4-5.
- Failure handling for unconfirmed tools and port conflicts: Tasks 2 and 5.

Placeholder scan:

- The plan contains no unresolved placeholder markers.
- Commands and file paths are explicit.
- Example JSON objects are complete and use concrete values.

Type consistency:

- Import fields match `backend/app/schemas/import_payload.py`.
- Guide fields match `GuideImport`.
- Verification uses existing `/api/tools` and `/api/tools/{slug}` behavior.
