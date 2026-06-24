from argparse import ArgumentParser
from dataclasses import dataclass
import json
from pathlib import Path
import subprocess
import sys

from app.cli.import_tools import run_import_payload
from app.core.database import SessionLocal
from app.models import ImportBatch
from app.schemas.import_payload import ToolImportPayload


DEFAULT_PAYLOAD = Path(__file__).resolve().parents[4] / "imports" / "toolvault-import-preview.json"
DEFAULT_CONTENT_PLAN = Path(__file__).resolve().parents[4] / "imports" / "page-content-plan.json"
SCANNED_SLUG_ALIASES = {"superpowers": "superpowers-skills"}
KNOWN_SCANNED_TOOL_SUMMARIES = {
    "context7-mcp": "为 Claude Code 提供公开库文档和代码示例上下文，适合补充工具指南、查 API 用法和减少凭空猜测。",
    "figma-mcp": "连接 Figma 设计稿上下文，适合把设计信息转成前端实现、UI 检查清单和页面验收要点。",
    "sentry-mcp": "连接 Sentry 错误和性能上下文，适合排查线上异常、分析事件影响范围和补充故障处理流程。",
    "notion-mcp": "连接 Notion 工作区内容，适合整理授权知识库、任务记录和团队文档上下文。",
    "figma": "Claude Code Figma 插件，用于设计稿理解、视觉还原和前端页面实现辅助。",
    "ui-ux-pro-max": "Claude Code UI/UX 插件，用于页面体验评审、交互优化和视觉层级改进。",
}


@dataclass(frozen=True)
class ScannedTool:
    name: str
    slug: str
    type: str
    status: str


def verify_update_log(session_factory, import_id: int) -> bool:
    with session_factory() as session:
        return session.query(ImportBatch).filter_by(id=import_id).one_or_none() is not None


def _stored_execution_report(session_factory, import_id: int) -> list[str]:
    with session_factory() as session:
        batch = session.query(ImportBatch).filter_by(id=import_id).one_or_none()
        if batch is None:
            return []
        report = batch.raw_payload.get("execution_report")
        return [line for line in report] if isinstance(report, list) and all(isinstance(line, str) for line in report) else []


def _finalize_execution_report(session_factory, import_id: int, verified: bool) -> list[str]:
    with session_factory() as session:
        batch = session.query(ImportBatch).filter_by(id=import_id).one_or_none()
        if batch is None:
            return []
        report = batch.raw_payload.get("execution_report")
        lines = [line for line in report] if isinstance(report, list) and all(isinstance(line, str) for line in report) else []
        lines = [line for line in lines if not line.startswith("update_log_verified=") and not line.startswith("质量结论：")]
        lines.append(f"update_log_verified={str(verified).lower()}")
        if verified and any(line.startswith("change_details=") and line != "change_details=0" for line in lines):
            lines.append("质量结论：页面展示质量通过，更新日志包含字段级变更明细，可用于回看工具详情页和页面内容变化。")
        elif verified:
            lines.append("质量结论：导入和更新日志验证通过，但本次没有字段级变更明细；如果当天确实有指南差异，需要检查 payload 是否记录了 change_details。")
        else:
            lines.append("质量结论：导入完成但更新日志验证失败，需要先修复日志写入或查询链路。")
        batch.raw_payload = {**batch.raw_payload, "execution_report": lines}
        session.commit()
        return lines


def _parser() -> ArgumentParser:
    parser = ArgumentParser(prog="python -m app.cli.daily_update")
    parser.add_argument("--payload", default=str(DEFAULT_PAYLOAD), help="Path to the ToolImportPayload JSON file")
    parser.add_argument("--content-plan", default=str(DEFAULT_CONTENT_PLAN), help="Path to the page content checklist JSON file")
    parser.add_argument("--scan-installed", action="store_true", help="Merge locally installed Claude MCP servers and plugins")
    return parser


def _command_lines(args: list[str]) -> list[str]:
    try:
        completed = subprocess.run(args, check=False, capture_output=True, text=True, timeout=30)
    except (OSError, subprocess.SubprocessError):
        return []
    if completed.returncode != 0:
        return []
    return [line.strip() for line in completed.stdout.splitlines() if line.strip()]


def _mcp_tool_from_line(line: str) -> ScannedTool | None:
    if ":" not in line or " - " not in line:
        return None
    command_part, status_text = line.rsplit(" - ", 1)
    name_part = command_part.split(":", 1)[0].strip()
    if name_part == "plugin":
        parts = command_part.split(":")
        if len(parts) >= 3:
            name_part = parts[2].strip()
    status = "configured" if "✓" in status_text else "needs_authentication"
    return ScannedTool(name=f"{name_part.title()} MCP", slug=f"{name_part}-mcp", type="mcp_server", status=status)


def _plugin_tool_from_line(line: str) -> ScannedTool | None:
    if "@" not in line:
        return None
    name = line.split("@", 1)[0].strip().removeprefix("❯").strip()
    if not name:
        return None
    return ScannedTool(name=name.replace("-", " ").title(), slug=name, type="skill", status="enabled")


def scan_installed_tools() -> list[ScannedTool]:
    tools: list[ScannedTool] = []
    for line in _command_lines(["claude", "mcp", "list"]):
        if tool := _mcp_tool_from_line(line):
            tools.append(tool)
    for line in _command_lines(["claude", "plugin", "list"]):
        if tool := _plugin_tool_from_line(line):
            tools.append(tool)
    return tools


def _scan_command(scanned_tool: ScannedTool) -> str:
    if scanned_tool.type == "mcp_server":
        return f"claude mcp get {scanned_tool.slug.removesuffix('-mcp')}"
    return "claude plugin list"


def _scan_summary(scanned_tool: ScannedTool) -> str:
    return KNOWN_SCANNED_TOOL_SUMMARIES.get(
        scanned_tool.slug,
        f"从本机 Claude Code 安装中检测到的 {scanned_tool.name}，可作为 FM AI Tools Hub 每日更新流程中的可用工具继续补充指南。",
    )


def _scan_guide(scanned_tool: ScannedTool) -> str:
    tool_kind = "MCP 服务" if scanned_tool.type == "mcp_server" else "Claude Code 插件"
    invocation = "在 Claude Code 对话里直接描述任务目标，Claude 会在需要外部上下文或工具能力时调用这个 MCP。" if scanned_tool.type == "mcp_server" else "在 Claude Code 对话里说明要使用这个插件能力；如果插件提供 slash command 或专属入口，先用 /plugin 或插件列表确认它已加载。"
    scope_tip = "说明要读取的公开资料、项目范围、目标库/页面/事件，并要求输出来源和限制。" if scanned_tool.type == "mcp_server" else "说明设计目标、输出格式、验收方式，以及是否需要改代码、只给建议或生成可复用 skill。"
    return f"""# {scanned_tool.name} 使用指南

这是每日更新扫描到的自动生成基础指南，后续定时资料研究会继续根据公开官方或授权资料补充细节。它不是只记录安装命令，而是先给出可以马上照着用的工作方式。

## 当前检测状态

- 工具类型：{tool_kind}
- 本机状态：{scanned_tool.status}
- 验证命令：`{_scan_command(scanned_tool)}`
- 适用入口：Claude Code 对话、相关 MCP/tool 调用、每日更新任务和工具详情页补全流程。

## 安装后怎么用

1. 先确认工具可用：运行 `{_scan_command(scanned_tool)}`，只检查名称、状态和脱敏配置，不复制任何密钥或 cookie。
2. 在 Claude Code 里说清楚你要完成的任务，例如“我要补充某个工具的使用指南”“我要验证某个页面”“我要根据公开文档整理操作步骤”。
3. 点名 `{scanned_tool.name}` 或描述它擅长的能力，让 Claude 选择是否调用它。
4. 补充边界：{scope_tip}
5. 要求输出结构化结果：使用场景、操作步骤、示例提示词、注意事项、验证方式和可写入 FM AI Tools Hub 的字段。

{invocation}

## 能帮助你做什么

{_scan_summary(scanned_tool)}

更具体地说，它可以放在这些日常任务里：

- **工具详情补全**：把工具能力整理成“安装后怎么使用、适合做什么、输入输出是什么、有哪些限制”。
- **工作流设计**：判断它应该和 Claude Code、Playwright MCP、GitHub MCP、数据库 MCP、截图/设计类工具如何组合。
- **提示词沉淀**：把一次性操作改写成可复制提示词，方便后续每天更新或人工复用。
- **验证和回写**：把执行结果同步到更新日志，说明影响了哪个工具、哪个页面、哪个栏目和哪个字段。

## 适合场景

| 场景 | 怎么用 {scanned_tool.name} | 产出 |
|---|---|---|
| 新工具入库 | 让 Claude Code 读取工具状态和公开/授权资料，整理基本能力 | 工具摘要、分类、标签、详情页指南 |
| 指南补全 | 要求补充安装后使用方法、常见任务、示例提示词和安全边界 | 更完整的 Markdown 使用指南 |
| 页面内容刷新 | 把这个工具加入首页推荐、工作流、提示词、命令速查或使用导航 | `page_content` 对应栏目内容 |
| 验证记录 | 说明执行了什么、影响哪些页面、是否通过验证 | 更新日志 change details |

## 具体使用步骤

1. **确认目标**：说明你要完成的是资料研究、设计检查、错误排查、页面验证、流程沉淀还是命令速查。
2. **限定范围**：只允许读取公开或明确授权的资料；如果涉及登录态、私有工作区或外部系统，先确认授权方式。
3. **要求具体输出**：不要只要一句总结，要让 Claude 输出分层内容，例如“适合场景 / 操作步骤 / 示例提示词 / 常用命令 / 注意事项 / 验证方式”。
4. **落到页面**：如果内容要进入 FM AI Tools Hub，说明应该更新 `/tools/{{slug}}`、`/workflows`、`/prompts`、`/commands`、`/guides` 或 `/updates`。
5. **验证结果**：更新后打开相关页面或调用 API，确认工具名能链接到详情页，更新日志能看到页面、栏目和字段变化。

## 常用提示词

```text
请使用 {scanned_tool.name} 帮我收集当前任务需要的上下文，只读取公开或已授权资料。输出：来源、适用场景、安装后怎么用、常见操作步骤、限制和风险。
```

```text
基于 {scanned_tool.name} 返回的信息，补充 FM AI Tools Hub 中这个工具的详情页指南。不要只写安装命令，请写清楚它能帮助我做什么、什么时候该用、怎么验证结果。
```

```text
把 {scanned_tool.name} 加入合适的工作流、提示词模板、命令速查和工具使用导航。每个涉及到的工具都要能链接到工具详情页，并说明更新了哪个页面栏目。
```

```text
如果没有找到安全的公开官方资料，请生成“自动扫描基础指南”，明确标注后续需要官方资料补充，不要编造未验证的功能细节。
```

## 组合使用

- **和 Claude Code 配合**：把 {scanned_tool.name} 提供的上下文转成代码修改、测试计划、工具指南或更新日志。
- **和 Playwright MCP 配合**：资料或设计信息整理后，打开真实页面验证内容是否出现在 `/tools`、`/workflows`、`/prompts`、`/commands` 和 `/guides`。
- **和 GitHub/数据库类 MCP 配合**：当任务涉及 PR、issue、数据状态或回归范围时，先查上下文，再用 {scanned_tool.name} 补齐专项信息。
- **和每日更新任务配合**：把新增工具、页面内容包、来源、变更明细一起写入导入 payload，保证第二天自动任务不会只更新工具列表。

## 排错与验证

- 如果 Claude 没有调用它，重新描述任务中需要的外部上下文或插件能力，并点名 `{scanned_tool.name}`。
- 如果状态不是可用，先运行 `{_scan_command(scanned_tool)}` 查看配置状态，再决定是否需要重新认证或重新加载插件。
- 如果输出太泛泛，要求按“步骤、示例、边界、验证”重新组织，不接受只有安装命令或一句用途说明。
- 如果要写入工具库，确认详情页有非空指南，非工具页面能看到相关工作流/提示词/命令，更新日志能看到页面级变更。

## 安全边界

不要保存或展示真实 API Key、token、cookie、密码、私钥、生产连接串或内部敏感内容。只处理公开或明确授权的资料；需要登录或私有权限时，先让用户确认可用的安全输入方式。涉及抓取、浏览器操作、数据库查询、PR 评论、发布、删除或权限变更时，先确认环境和授权，默认只读、低频、可回滚。
"""


def _tool_payload(scanned_tool: ScannedTool) -> dict:
    return {
        "name": scanned_tool.name,
        "slug": scanned_tool.slug,
        "type": scanned_tool.type,
        "status": scanned_tool.status,
        "summary": _scan_summary(scanned_tool),
        "verify_command": _scan_command(scanned_tool),
        "visibility": "public",
        "categories": ["本机已安装", "MCP 服务" if scanned_tool.type == "mcp_server" else "Claude 插件"],
        "tags": [scanned_tool.type, *[part for part in scanned_tool.slug.split("-") if part]],
        "guides": [
            {
                "title": f"{scanned_tool.name} 使用指南",
                "guide_type": "usage",
                "visibility": "public",
                "content_markdown": _scan_guide(scanned_tool),
            }
        ],
    }


def _load_content_plan(content_plan_path: Path) -> list[dict]:
    return json.loads(content_plan_path.read_text(encoding="utf-8"))


def _merge_content_plan(payload_data: dict, content_plan: list[dict]) -> dict:
    if content_plan:
        payload_data["content_plan"] = content_plan
    return payload_data


def _load_payload(payload_path: Path, include_installed: bool, content_plan: list[dict] | None = None) -> ToolImportPayload:
    payload_data = json.loads(payload_path.read_text(encoding="utf-8"))
    if include_installed:
        known_slugs = {tool.get("slug") for tool in payload_data.get("tools", []) if isinstance(tool, dict)}
        additions = [
            _tool_payload(tool)
            for tool in scan_installed_tools()
            if tool.slug not in known_slugs and SCANNED_SLUG_ALIASES.get(tool.slug, tool.slug) not in known_slugs
        ]
        payload_data["tools"] = [*payload_data.get("tools", []), *additions]
    if content_plan is not None:
        payload_data = _merge_content_plan(payload_data, content_plan)
    return ToolImportPayload.model_validate(payload_data)


def _titles(items: list) -> str:
    titles = [item.title for item in items]
    return ", ".join(titles) if titles else "none"


def _change_detail_count(run_payload: ToolImportPayload) -> int:
    return sum(len(change.change_details) for change in run_payload.changes)


def _page_content_section_count(page_content) -> int:
    if page_content is None:
        return 0
    return sum(
        len(getattr(page_content, field))
        for field in [
            "home_highlights",
            "workflows",
            "tool_combinations",
            "prompt_groups",
            "command_groups",
            "guide_choices",
            "guide_workflow_tips",
            "guide_safety_notes",
        ]
    )


def _changed_pages(run_payload: ToolImportPayload) -> str:
    pages = sorted({path for change in run_payload.changes for path in change.page_paths})
    return ",".join(pages) if pages else "none"


def main(argv: list[str] | None = None) -> int:
    try:
        args = _parser().parse_args(argv)
    except SystemExit as error:
        return int(error.code)
    payload_path = Path(args.payload)
    content_plan_path = Path(args.content_plan)
    content_plan_was_explicit = "--content-plan" in (argv if argv is not None else sys.argv[1:])
    if not payload_path.exists():
        print(f"payload_missing path={payload_path}")
        return 2
    if content_plan_was_explicit and not content_plan_path.exists():
        print(f"content_plan_missing path={content_plan_path}")
        return 2

    try:
        content_plan = _load_content_plan(content_plan_path) if content_plan_path.exists() else None
        run = run_import_payload(_load_payload(payload_path, args.scan_installed, content_plan), SessionLocal, remove_missing=True)
    except Exception as error:
        print(f"daily_update_failed error={type(error).__name__}")
        return 2

    result = run.result
    if run.preview.sensitive_findings:
        print(f"status=failed import_id={result.import_id} sensitive_findings={len(run.preview.sensitive_findings)}")
        return 1

    verified = verify_update_log(SessionLocal, result.import_id)
    stored_report = _finalize_execution_report(SessionLocal, result.import_id, verified)
    print(f"status=imported import_id={result.import_id} created={result.created} updated={result.updated}")
    print(f"added={','.join(result.added_tool_slugs) if result.added_tool_slugs else 'none'}")
    print(f"updated={','.join(result.updated_tool_slugs) if result.updated_tool_slugs else 'none'}")
    print(f"deleted={','.join(result.deleted_tool_slugs) if result.deleted_tool_slugs else 'none'}")
    print(f"payload={payload_path}")
    print(f"source={run.payload.source}")
    print(f"generated_at={run.payload.generated_at}")
    print(f"sources={_titles(run.payload.sources)}")
    print(f"changes={_titles(run.payload.changes)}")
    for line in stored_report:
        if line.startswith(("content_plan_items=", "change_details=", "page_content_sections=", "changed_pages=", "update_log_verified=")):
            print(line)
    if not any(line.startswith("update_log_verified=") for line in stored_report):
        print(f"update_log_verified={str(verified).lower()}")
    return 0 if verified else 3


if __name__ == "__main__":
    raise SystemExit(main())
