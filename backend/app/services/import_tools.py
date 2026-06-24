from dataclasses import dataclass
import re
from typing import Any

from sqlalchemy.orm import Session

from app.models import Category, Guide, ImportBatch, Tag, Tool
from app.schemas.import_payload import ImportPreviewResult, ToolImportPayload
from app.services.sensitive_scan import find_sensitive_findings


@dataclass(frozen=True)
class ImportResult:
    created: int
    updated: int
    import_id: int
    added_tool_slugs: list[str]
    updated_tool_slugs: list[str]
    deleted_tool_slugs: list[str]


PAGE_CONTENT_FIELDS = [
    "home_highlights",
    "workflows",
    "tool_combinations",
    "prompt_groups",
    "command_groups",
    "guide_choices",
    "guide_workflow_tips",
    "guide_safety_notes",
]


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9一-鿿]+", "-", value.strip().lower()).strip("-")
    return slug or "item"


def preview_tool_payload(payload: ToolImportPayload) -> ImportPreviewResult:
    categories = {category for tool in payload.tools for category in tool.categories}
    tags = {tag for tool in payload.tools for tag in tool.tags}
    guides = sum(len(tool.guides) for tool in payload.tools)
    findings = [finding.__dict__ for finding in find_sensitive_findings(payload.model_dump())]
    return ImportPreviewResult(
        tool_count=len(payload.tools),
        guide_count=guides,
        category_count=len(categories),
        tag_count=len(tags),
        sensitive_findings=findings,
    )


def _get_or_create_category(db: Session, name: str) -> Category:
    slug = slugify(name)
    category = db.query(Category).filter_by(slug=slug).one_or_none()
    if category is None:
        category = Category(name=name, slug=slug)
        db.add(category)
        db.flush()
    return category


def _get_or_create_tag(db: Session, name: str) -> Tag:
    slug = slugify(name)
    tag = db.query(Tag).filter_by(slug=slug).one_or_none()
    if tag is None:
        tag = Tag(name=name, slug=slug)
        db.add(tag)
        db.flush()
    return tag


def _safe_failed_payload(payload: ToolImportPayload, preview: ImportPreviewResult) -> dict[str, Any]:
    return {
        "source": payload.source,
        "generated_at": payload.generated_at,
        "tool_count": preview.tool_count,
        "sensitive_findings": preview.sensitive_findings,
    }


def _payload_tools_by_slug(raw_payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    tools = raw_payload.get("tools")
    if not isinstance(tools, list):
        return {}
    return {tool["slug"]: tool for tool in tools if isinstance(tool, dict) and isinstance(tool.get("slug"), str)}


def _latest_imported_tools(db: Session) -> dict[str, dict[str, Any]]:
    batch = db.query(ImportBatch).filter_by(status="imported").order_by(ImportBatch.id.desc()).first()
    if batch is None:
        return {}
    return _payload_tools_by_slug(batch.raw_payload)


def _current_database_tool_slugs(db: Session) -> set[str]:
    return {slug for (slug,) in db.query(Tool.slug).all()}


def _default_content_plan(payload: ToolImportPayload) -> list[dict[str, Any]]:
    tool_slugs = [tool.slug for tool in payload.tools]
    return [
        {
            "page_path": "/tools",
            "page_name": "工具库列表页",
            "section": "工具卡片",
            "required_content": ["展示工具名称、摘要、类型标识和标签", "标识筛选覆盖当前工具类型"],
            "tool_slugs": tool_slugs,
            "status": "planned",
        },
        {
            "page_path": "/tools/{slug}",
            "page_name": "工具详情页",
            "section": "使用指南",
            "required_content": ["说明安装后怎么使用", "说明能帮助用户做什么", "包含常用命令和注意事项"],
            "tool_slugs": tool_slugs,
            "status": "planned",
        },
        {
            "page_path": "/updates",
            "page_name": "更新日志页",
            "section": "变更明细",
            "required_content": ["展示来源、北京时间、验证结果", "展示具体工具、页面、栏目和字段变化"],
            "tool_slugs": tool_slugs,
            "status": "planned",
        },
    ]


def _field_section(field: str) -> tuple[str, str]:
    if field in {"summary", "name", "type", "status", "visibility", "homepage_url"}:
        return "基本信息", field
    if field in {"install_command", "verify_command"}:
        return "命令", field
    if field in {"categories", "tags"}:
        return "标签", field
    return "基本信息", field


def _safe_text(value: Any) -> str:
    text = "" if value is None else str(value)
    return text if len(text) <= 240 else f"{text[:237]}..."


def _source_titles(payload_data: dict[str, Any]) -> list[str]:
    return [source["title"] for source in _as_sources(payload_data) if isinstance(source.get("title"), str)]


def _as_sources(payload_data: dict[str, Any]) -> list[dict[str, Any]]:
    sources = payload_data.get("sources")
    return sources if isinstance(sources, list) else []


def _guide_map(tool: dict[str, Any]) -> dict[tuple[str, str], dict[str, Any]]:
    guides = tool.get("guides")
    if not isinstance(guides, list):
        return {}
    return {
        (guide.get("title", ""), guide.get("guide_type", "usage")): guide
        for guide in guides
        if isinstance(guide, dict)
    }


def _public_tool_refs(payload_data: dict[str, Any]) -> list[dict[str, str]]:
    tools = payload_data.get("tools")
    if not isinstance(tools, list):
        return []
    return [
        {"name": str(tool.get("name", tool.get("slug", ""))), "slug": tool["slug"], "type": str(tool.get("type", ""))}
        for tool in tools
        if isinstance(tool, dict) and isinstance(tool.get("slug"), str) and tool.get("visibility", "public") == "public"
    ]


def _page_content_item_key(item: Any) -> str:
    if isinstance(item, dict):
        for field in ["title", "need", "scenario"]:
            value = item.get(field)
            if isinstance(value, str) and value:
                return value
    return str(item)


def _tool_ref_key(tool: Any) -> str:
    if not isinstance(tool, dict):
        return str(tool)
    return str(tool.get("slug") or tool.get("name") or tool)


def _merge_page_content_items(existing: Any, generated: Any) -> list[Any]:
    merged = [*existing] if isinstance(existing, list) else []
    index_by_key = {_page_content_item_key(item): index for index, item in enumerate(merged)}
    for item in generated if isinstance(generated, list) else []:
        key = _page_content_item_key(item)
        if key not in index_by_key:
            index_by_key[key] = len(merged)
            merged.append(item)
            continue
        target = merged[index_by_key[key]]
        if not isinstance(target, dict) or not isinstance(item, dict):
            continue
        if isinstance(target.get("tools"), list) and isinstance(item.get("tools"), list):
            tool_keys = {_tool_ref_key(tool) for tool in target["tools"]}
            target["tools"] = [*target["tools"], *[tool for tool in item["tools"] if _tool_ref_key(tool) not in tool_keys]]
        for list_field in ["commands", "prompts"]:
            if isinstance(target.get(list_field), list) and isinstance(item.get(list_field), list):
                seen = set(target[list_field])
                target[list_field] = [*target[list_field], *[value for value in item[list_field] if value not in seen]]
    return merged


def _merge_page_content(previous_payload: dict[str, Any], current_payload: dict[str, Any]) -> dict[str, Any]:
    previous_content = previous_payload.get("page_content") if isinstance(previous_payload.get("page_content"), dict) else {}
    current_content = current_payload.get("page_content") if isinstance(current_payload.get("page_content"), dict) else {}
    generated_content = _default_page_content(current_payload)
    merged = generated_content.copy()
    for field in PAGE_CONTENT_FIELDS:
        previous_value = previous_content.get(field)
        generated_value = generated_content.get(field)
        current_value = current_content.get(field)
        base_value = _merge_page_content_items(previous_value, generated_value)
        merged[field] = current_value if isinstance(current_value, list) and current_value else base_value
    return merged


def _default_page_content(payload_data: dict[str, Any]) -> dict[str, Any]:
    tool_refs = _public_tool_refs(payload_data)
    mcp_tools = [tool for tool in tool_refs if "mcp" in tool["type"]]
    skill_tools = [tool for tool in tool_refs if tool["type"] == "skill"]
    cli_tools = [tool for tool in tool_refs if "cli" in tool["type"]]
    highlighted = tool_refs[:4]
    primary_tools = tool_refs[:6] or highlighted
    return {
        "home_highlights": [
            {
                "title": "每日工具能力刷新",
                "description": "根据本机已安装工具和公开/授权资料刷新工具详情、工作流、提示词和命令速查。",
                "tools": highlighted,
            }
        ],
        "workflows": [
            {
                "title": "新增工具入库和指南补全",
                "flow": "扫描本机 MCP/plugin/CLI → 生成基础使用指南 → 按页面清单补全工作流和命令速查 → 写入更新日志。",
                "prompt": "检查这些新增工具的公开资料，补充安装后怎么用、适合做什么、常用提示词和安全边界。",
                "tools": primary_tools,
            },
            {
                "title": "MCP 资料研究和验证",
                "flow": "MCP 工具提供上下文或自动化能力 → Claude Code 整理指南 → Playwright 或 API 验证页面展示。",
                "prompt": "用已安装 MCP 工具完成资料查询或页面验证，并把结果整理进 FM AI Tools Hub。",
                "tools": mcp_tools[:6],
            },
            {
                "title": "插件和技能流程沉淀",
                "flow": "Claude Code 插件/skill 提供专项能力 → 结合项目任务形成可复用提示词和工作流。",
                "prompt": "根据已安装插件能力，补充适合它的使用场景、触发方式和验收步骤。",
                "tools": skill_tools[:6],
            },
        ],
        "tool_combinations": [
            {
                "title": "工具详情补全组合",
                "flow": "公开资料查询 → Claude Code 改写成使用指南 → 更新日志记录页面和字段变化。",
                "prompt": "把这些工具组合成一个可执行的指南更新流程，并列出每个工具负责的步骤。",
                "tools": primary_tools,
            }
        ],
        "prompt_groups": [
            {
                "title": "每日指南更新",
                "description": "用于每天早上按页面内容清单补全工具库和导航页面。",
                "tools": primary_tools,
                "prompts": [
                    "按 page-content-plan.json 逐项检查页面内容，找出新增工具需要补充的详情、工作流、提示词和命令。",
                    "不要只写安装命令，请补充安装后怎么用、能帮我做什么、常用提示词、组合方式和安全边界。",
                ],
            },
            {
                "title": "新增工具基础指南",
                "description": "当缺少安全公开来源时，先生成明确标注的基础指南，避免详情页空白。",
                "tools": tool_refs[-6:],
                "prompts": [
                    "为这个新扫描到的工具生成基础使用指南，明确标注后续需要根据官方公开资料继续补充。",
                ],
            },
        ],
        "command_groups": [
            {
                "title": "本机工具扫描",
                "tools": primary_tools,
                "commands": ["claude mcp list", "claude plugin list"],
                "note": "只读取工具名称、状态和脱敏配置，不保存真实 API Key、token、cookie 或生产连接串。",
            },
            *[
                {
                    "title": tool["name"],
                    "tools": [tool],
                    "commands": [f"claude mcp get {tool['slug'].removesuffix('-mcp')}" if "mcp" in tool["type"] else "claude plugin list"],
                    "note": "用于确认本机安装状态；涉及外部系统时只使用公开或授权资料。",
                }
                for tool in tool_refs[-8:]
            ],
        ],
        "guide_choices": [
            {"need": "浏览器、GitHub、数据库、公开资料、设计工具等 MCP 能力", "tools": mcp_tools},
            {"need": "Claude Code 插件、skills 和可复用流程", "tools": skill_tools},
            {"need": "CLI 工具、脚本、迁移和本地验证命令", "tools": cli_tools},
        ],
        "guide_workflow_tips": [
            {
                "scenario": "每天自动更新工具知识库",
                "tools": primary_tools,
                "suggestion": "先扫描新增工具，再按页面内容清单补详情、工作流、提示词、命令和更新日志。",
            }
        ],
        "guide_safety_notes": [
            "不要把真实 API Key、token、cookie、密码、私钥或生产连接串写入导入 JSON、页面内容或更新日志。",
            "只查询公开或明确授权的资料；不要抓取登录后页面、付费墙、内部系统或敏感内容。",
            "新增工具没有安全来源时，先生成基础指南并标注后续需要官方资料补充。",
        ],
    }


def _page_content_change_details(previous_payload: dict[str, Any], current_payload: dict[str, Any]) -> list[dict[str, Any]]:
    previous_content = previous_payload.get("page_content") if isinstance(previous_payload.get("page_content"), dict) else {}
    current_content = current_payload.get("page_content") if isinstance(current_payload.get("page_content"), dict) else {}
    sections = [
        ("home_highlights", "/", "首页推荐"),
        ("workflows", "/workflows", "推荐组合工作流"),
        ("tool_combinations", "/workflows", "组合使用示例"),
        ("prompt_groups", "/workflows", "提示词模板"),
        ("command_groups", "/workflows", "命令清单"),
        ("guide_choices", "/guides", "工具使用导航"),
        ("guide_workflow_tips", "/guides", "常见组合路线"),
        ("guide_safety_notes", "/guides", "安全注意事项"),
    ]
    details: list[dict[str, Any]] = []
    source_titles = _source_titles(current_payload)
    for field, page_path, section in sections:
        previous_value = previous_content.get(field, [])
        current_value = current_content.get(field, [])
        if previous_value != current_value:
            details.append(
                {
                    "tool_slug": "",
                    "tool_name": "",
                    "page_path": page_path,
                    "section": section,
                    "field": f"page_content.{field}",
                    "change_type": "updated" if previous_value and current_value else ("added" if current_value else "deleted"),
                    "before": _safe_text(previous_value),
                    "after": _safe_text(current_value),
                    "source_titles": source_titles,
                }
            )
    return details


def _tool_change_details(
    previous_tools: dict[str, dict[str, Any]],
    current_tools: dict[str, dict[str, Any]],
    added: list[str],
    updated: list[str],
    deleted: list[str],
    payload_data: dict[str, Any],
) -> list[dict[str, Any]]:
    details: list[dict[str, Any]] = []
    source_titles = _source_titles(payload_data)
    compared_fields = [
        "name",
        "type",
        "status",
        "summary",
        "homepage_url",
        "install_command",
        "verify_command",
        "visibility",
        "categories",
        "tags",
    ]

    for slug in added:
        tool = current_tools.get(slug, {})
        details.append(
            {
                "tool_slug": slug,
                "tool_name": str(tool.get("name", slug)),
                "page_path": f"/tools/{slug}",
                "section": "工具详情页",
                "field": "tool",
                "change_type": "added",
                "before": "",
                "after": _safe_text(tool.get("summary", "")),
                "source_titles": source_titles,
            }
        )

    for slug in updated:
        previous = previous_tools.get(slug, {})
        current = current_tools.get(slug, {})
        tool_name = str(current.get("name") or previous.get("name") or slug)
        for field in compared_fields:
            if previous.get(field) != current.get(field):
                section, field_name = _field_section(field)
                details.append(
                    {
                        "tool_slug": slug,
                        "tool_name": tool_name,
                        "page_path": f"/tools/{slug}",
                        "section": section,
                        "field": field_name,
                        "change_type": "updated",
                        "before": _safe_text(previous.get(field, "")),
                        "after": _safe_text(current.get(field, "")),
                        "source_titles": source_titles,
                    }
                )

        previous_guides = _guide_map(previous)
        current_guides = _guide_map(current)
        for guide_key in sorted(set(previous_guides) | set(current_guides)):
            previous_guide = previous_guides.get(guide_key, {})
            current_guide = current_guides.get(guide_key, {})
            title = guide_key[0]
            if previous_guide.get("content_markdown") != current_guide.get("content_markdown"):
                details.append(
                    {
                        "tool_slug": slug,
                        "tool_name": tool_name,
                        "page_path": f"/tools/{slug}",
                        "section": "使用指南",
                        "field": f"guides.{title}.content_markdown",
                        "change_type": "updated" if previous_guide and current_guide else ("added" if current_guide else "deleted"),
                        "before": _safe_text(previous_guide.get("content_markdown", "")),
                        "after": _safe_text(current_guide.get("content_markdown", "")),
                        "source_titles": source_titles,
                    }
                )

    for slug in deleted:
        tool = previous_tools.get(slug, {})
        tool_name = str(tool.get("name", slug))
        details.extend(
            [
                {
                    "tool_slug": slug,
                    "tool_name": tool_name,
                    "page_path": f"/tools/{slug}",
                    "section": "工具详情页",
                    "field": "tool",
                    "change_type": "deleted",
                    "before": _safe_text(tool.get("summary", "")),
                    "after": "",
                    "source_titles": source_titles,
                },
                {
                    "tool_slug": slug,
                    "tool_name": tool_name,
                    "page_path": "/tools",
                    "section": "工具卡片",
                    "field": "tool_card",
                    "change_type": "deleted",
                    "before": tool_name,
                    "after": "",
                    "source_titles": source_titles,
                },
            ]
        )
    return details


def _enrich_changes(payload_data: dict[str, Any], added: list[str], updated: list[str], deleted: list[str], change_details: list[dict[str, Any]]) -> dict[str, Any]:
    changes = payload_data.get("changes")
    if not isinstance(changes, list) or not changes:
        changes = [
            {
                "title": "Tool library refresh",
                "change_type": "tool_inventory_update",
                "description": "Refresh tool inventory from the daily update payload.",
                "tool_slugs": [],
                "page_paths": ["/tools", "/updates"],
            }
        ]
        payload_data["changes"] = changes

    first_change = changes[0]
    if isinstance(first_change, dict):
        first_change["added_tool_slugs"] = added
        first_change["updated_tool_slugs"] = updated
        first_change["deleted_tool_slugs"] = deleted
        current_slugs = first_change.get("tool_slugs") if isinstance(first_change.get("tool_slugs"), list) else []
        detail_slugs = [detail.get("tool_slug") for detail in change_details if isinstance(detail.get("tool_slug"), str) and detail.get("tool_slug")]
        first_change["tool_slugs"] = sorted(set(current_slugs) | set(added) | set(updated) | set(deleted) | set(detail_slugs))
        current_paths = first_change.get("page_paths") if isinstance(first_change.get("page_paths"), list) else []
        detail_paths = [detail.get("page_path") for detail in change_details if isinstance(detail.get("page_path"), str) and detail.get("page_path")]
        first_change["page_paths"] = sorted(set(current_paths) | set(detail_paths))
        existing_details = first_change.get("change_details") if isinstance(first_change.get("change_details"), list) else []
        first_change["change_details"] = [*existing_details, *change_details]
    return payload_data


def _change_detail_count(payload_data: dict[str, Any]) -> int:
    changes = payload_data.get("changes") if isinstance(payload_data.get("changes"), list) else []
    return sum(
        len(change.get("change_details", []))
        for change in changes
        if isinstance(change, dict) and isinstance(change.get("change_details"), list)
    )


def _page_content_section_count(page_content: Any) -> int:
    if not isinstance(page_content, dict):
        return 0
    return sum(
        len(page_content.get(field, []))
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
        if isinstance(page_content.get(field, []), list)
    )


def _changed_pages(payload_data: dict[str, Any]) -> str:
    changes = payload_data.get("changes") if isinstance(payload_data.get("changes"), list) else []
    pages = sorted(
        path
        for change in changes
        if isinstance(change, dict)
        for path in change.get("page_paths", [])
        if isinstance(path, str)
    )
    return ",".join(pages) if pages else "none"


def _execution_report(payload_data: dict[str, Any], result: ImportResult, update_log_verified: bool) -> list[str]:
    added = ",".join(result.added_tool_slugs) if result.added_tool_slugs else "none"
    updated = ",".join(result.updated_tool_slugs) if result.updated_tool_slugs else "none"
    deleted = ",".join(result.deleted_tool_slugs) if result.deleted_tool_slugs else "none"
    change_details = _change_detail_count(payload_data)
    report = [
        f"结果：status=imported import_id={result.import_id} created={result.created} updated={result.updated}",
        f"added={added}",
        f"updated={updated}",
        f"deleted={deleted}",
        f"source={payload_data.get('source', '')}",
        f"generated_at={payload_data.get('generated_at', '')}",
        f"content_plan_items={len(payload_data.get('content_plan', [])) if isinstance(payload_data.get('content_plan'), list) else 0}",
        f"change_details={change_details}",
        f"page_content_sections={_page_content_section_count(payload_data.get('page_content'))}",
        f"changed_pages={_changed_pages(payload_data)}",
        f"update_log_verified={str(update_log_verified).lower()}",
    ]
    if change_details > 0 and update_log_verified:
        report.append("质量结论：页面展示质量通过，更新日志包含字段级变更明细，可用于回看工具详情页和页面内容变化。")
    elif update_log_verified:
        report.append("质量结论：导入和更新日志验证通过，但本次没有字段级变更明细；如果当天确实有指南差异，需要检查 payload 是否记录了 change_details。")
    else:
        report.append("质量结论：导入完成但更新日志验证失败，需要先修复日志写入或查询链路。")
    return report


def import_tool_payload(db: Session, payload: ToolImportPayload, remove_missing: bool = False) -> ImportResult:
    preview = preview_tool_payload(payload)
    if preview.sensitive_findings:
        batch = ImportBatch(
            source=payload.source,
            status="failed",
            summary="Sensitive content detected",
            raw_payload=_safe_failed_payload(payload, preview),
        )
        db.add(batch)
        db.commit()
        return ImportResult(created=0, updated=0, import_id=batch.id, added_tool_slugs=[], updated_tool_slugs=[], deleted_tool_slugs=[])

    previous_tools = _latest_imported_tools(db)
    previous_payload = db.query(ImportBatch).filter_by(status="imported").order_by(ImportBatch.id.desc()).first()
    previous_payload_data = previous_payload.raw_payload if previous_payload is not None else {}
    current_payload_data = payload.model_dump()
    if not current_payload_data.get("content_plan"):
        current_payload_data["content_plan"] = _default_content_plan(payload)
    current_payload_data["page_content"] = _merge_page_content(previous_payload_data, current_payload_data)
    current_tools = _payload_tools_by_slug(current_payload_data)
    previous_slugs = set(previous_tools)
    if remove_missing:
        previous_slugs |= _current_database_tool_slugs(db)
    added_tool_slugs = sorted(set(current_tools) - previous_slugs)
    deleted_tool_slugs = sorted(previous_slugs - set(current_tools)) if remove_missing else []
    updated_tool_slugs = sorted(
        slug for slug in set(current_tools) & set(previous_tools) if current_tools[slug] != previous_tools[slug]
    )

    created = 0
    updated = 0
    for slug in deleted_tool_slugs:
        tool = db.query(Tool).filter_by(slug=slug).one_or_none()
        if tool is not None:
            db.delete(tool)

    for item in payload.tools:
        tool = db.query(Tool).filter_by(slug=item.slug).one_or_none()
        if tool is None:
            tool = Tool(name=item.name, slug=item.slug, type=item.type, status=item.status)
            created += 1
            db.add(tool)
        else:
            updated += 1

        tool.name = item.name
        tool.type = item.type
        tool.status = item.status
        tool.summary = item.summary
        tool.homepage_url = item.homepage_url
        tool.install_command = item.install_command
        tool.verify_command = item.verify_command
        tool.visibility = item.visibility
        tool.is_skill_candidate = item.is_skill_candidate
        tool.is_runbook_candidate = item.is_runbook_candidate
        tool.categories = [_get_or_create_category(db, name) for name in item.categories]
        tool.tags = [_get_or_create_tag(db, name) for name in item.tags]
        tool.guides.clear()
        for guide in item.guides:
            tool.guides.append(
                Guide(
                    title=guide.title,
                    guide_type=guide.guide_type,
                    visibility=guide.visibility,
                    content_markdown=guide.content_markdown,
                )
            )

    change_details = [
        *_tool_change_details(
            previous_tools,
            current_tools,
            added_tool_slugs,
            updated_tool_slugs,
            deleted_tool_slugs,
            current_payload_data,
        ),
        *_page_content_change_details(previous_payload_data, current_payload_data),
    ]
    raw_payload = _enrich_changes(current_payload_data, added_tool_slugs, updated_tool_slugs, deleted_tool_slugs, change_details)
    batch = ImportBatch(
        source=payload.source,
        status="imported",
        summary=f"created={created}, updated={updated}",
        raw_payload=raw_payload,
    )
    db.add(batch)
    db.flush()
    result = ImportResult(
        created=created,
        updated=updated,
        import_id=batch.id,
        added_tool_slugs=added_tool_slugs,
        updated_tool_slugs=updated_tool_slugs,
        deleted_tool_slugs=deleted_tool_slugs,
    )
    batch.raw_payload = {**raw_payload, "execution_report": _execution_report(raw_payload, result, True)}
    db.commit()
    return result
