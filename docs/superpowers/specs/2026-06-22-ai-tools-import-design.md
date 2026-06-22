# AI Tools Import Design

## Goal

Populate ToolVault with a reviewed, sanitized import of the user's commonly installed AI and developer-assistant tools, replacing the current one-item sample-only catalog with a richer catalog that can be displayed and searched in the running app.

## Non-Goals

- Do not make the ToolVault web service scan local user directories.
- Do not import secrets, tokens, cookies, session data, private keys, or raw private configuration values.
- Do not build a persistent auto-scanner or background sync feature in this iteration.
- Do not mark a tool as installed unless the local environment provides evidence that it is installed or configured.

## Scope

The import should cover common AI tooling visible in the local environment:

- Claude ecosystem: Claude Code, configured Claude MCP servers, Claude Code skills, Superpowers skills, and safe Claude workflow metadata.
- AI CLI and agent tools: Gemini CLI, Codex/OpenAI CLI, Qwen-related CLI, Aider, and other AI coding CLIs discoverable through PATH or safe version/help commands.
- AI IDE and desktop tools: Cursor, Windsurf, Claude Desktop, and similar tools visible through command paths or application locations.
- Existing project tools and docs: Playwright MCP and ToolVault project documentation that already describe tool usage flows.

## Data Sources

Use local read-only evidence to build the import:

- CLI discovery commands such as `command -v`, `which`, and safe `--version` or help commands.
- Claude MCP list/get output, limited to non-sensitive server metadata and sanitized command examples.
- Skill metadata such as names and descriptions.
- Existing Markdown guide content when it is relevant and does not contain secrets.
- Project docs and fixtures for existing ToolVault examples.

The generated data should be written to:

```text
imports/toolvault-import-preview.json
```

## Safety and Sanitization

Only import tool knowledge and reproducible installation or verification instructions. Never import private credential values.

Rules:

- Replace sensitive command arguments and environment values with placeholders such as `YOUR_TOKEN`.
- Do not preserve raw config files in the import payload.
- Do not import any value that looks like a token, API key, password, cookie, bearer token, private key, or session value.
- Run the existing backend import preview or sensitive scanner before writing data to the database.
- If the sensitive scanner reports findings, stop before import and report the offending paths.

## Import Data Model

Use the existing ToolVault schema:

```json
{
  "source": "claude_local_scan",
  "generated_at": "2026-06-22T00:00:00+08:00",
  "tools": [
    {
      "name": "Claude Code",
      "slug": "claude-code",
      "type": "cli",
      "status": "installed",
      "summary": "Anthropic 的本地 AI 编程助手 CLI，用于代码理解、修改、运行和验证。",
      "homepage_url": "",
      "install_command": "npm install -g @anthropic-ai/claude-code",
      "verify_command": "claude --version",
      "visibility": "public",
      "is_skill_candidate": false,
      "is_runbook_candidate": true,
      "categories": ["AI 工具", "CLI 工具"],
      "tags": ["claude", "agent", "coding"],
      "guides": [
        {
          "title": "使用指南",
          "guide_type": "usage",
          "visibility": "public",
          "content_markdown": "# Claude Code 使用指南\n\n用于在本地项目中理解代码、编辑文件、运行验证命令并记录工作流。"
        }
      ]
    }
  ]
}
```

Guidance:

- Each tool should have at least one useful Markdown guide.
- Existing `Playwright MCP` should be updated with a more complete guide rather than left as the short sample entry.
- Claude MCP servers should be represented as individual tool entries when they have distinct purpose or usage.
- Superpowers and Claude Code skills should be grouped into a small number of tool entries instead of one entry per skill, to avoid overwhelming the catalog.
- Use stable slugs so repeated imports update existing records through the current upsert behavior.

## Data Flow

1. Gather local evidence for common AI tools.
2. Build a sanitized `imports/toolvault-import-preview.json` payload.
3. Run ToolVault's import preview or sensitive scanner against the payload.
4. If preview passes, import the payload with the existing CLI import command.
5. Start ToolVault backend and frontend.
6. Verify the running UI in a browser.

## Verification

Runtime verification should prove that the app displays the imported data, not just that the JSON file exists.

Required browser checks:

- The tool list contains multiple AI tool entries, not only `Playwright MCP`.
- Searching for representative terms such as `Claude`, `Gemini`, and `Cursor` returns matching entries when those tools are confirmed locally.
- The `Playwright MCP` detail page shows a substantially richer guide than the old two-line sample.
- At least two other imported tool detail pages render Markdown guides correctly.

Required API/data checks:

- `/api/tools` returns multiple public tools after import.
- The import preview reports zero sensitive findings.

## Failure Handling

- If a tool cannot be confirmed locally, omit it or mark it as `available` only when the guide clearly describes it as not confirmed installed.
- If any sensitive finding is reported, do not import the payload until the finding is removed or replaced with a placeholder.
- If local app startup is blocked by port conflicts, use alternate ports rather than stopping unrelated user processes.
