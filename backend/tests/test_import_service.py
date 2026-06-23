import json

from app.models import ImportBatch, Tool
from app.schemas.import_payload import ToolImportPayload
from app.services.import_tools import import_tool_payload, preview_tool_payload


def _payload(summary="Browser automation"):
    return ToolImportPayload.model_validate(
        {
            "source": "claude_local_scan",
            "generated_at": "2026-06-18T10:00:00+08:00",
            "tools": [
                {
                    "name": "Playwright MCP",
                    "slug": "playwright-mcp",
                    "type": "mcp",
                    "status": "configured",
                    "summary": summary,
                    "visibility": "public",
                    "categories": ["测试工具", "MCP"],
                    "tags": ["playwright", "browser"],
                    "guides": [
                        {
                            "title": "使用指南",
                            "guide_type": "usage",
                            "visibility": "public",
                            "content_markdown": "# Guide",
                        }
                    ],
                }
            ],
        }
    )


def test_preview_counts_payload_items():
    preview = preview_tool_payload(_payload())

    assert preview.tool_count == 1
    assert preview.guide_count == 1
    assert preview.category_count == 2
    assert preview.tag_count == 2
    assert preview.sensitive_findings == []


def test_import_creates_tool_and_history(db_session):
    result = import_tool_payload(db_session, _payload())

    assert result.created == 1
    assert result.updated == 0
    saved = db_session.query(Tool).filter_by(slug="playwright-mcp").one()
    assert saved.categories[0].name in {"测试工具", "MCP"}
    assert saved.guides[0].title == "使用指南"
    assert db_session.query(ImportBatch).count() == 1


def test_import_updates_existing_tool_by_slug(db_session):
    import_tool_payload(db_session, _payload())
    result = import_tool_payload(db_session, _payload(summary="Updated summary"))

    assert result.created == 0
    assert result.updated == 1
    saved = db_session.query(Tool).filter_by(slug="playwright-mcp").one()
    assert saved.summary == "Updated summary"


def test_import_records_summary_change_detail(db_session):
    import_tool_payload(db_session, _payload(summary="Old summary"))
    import_tool_payload(db_session, _payload(summary="Updated summary"), remove_missing=True)

    batch = db_session.query(ImportBatch).order_by(ImportBatch.id.desc()).first()
    detail = batch.raw_payload["changes"][0]["change_details"][0]
    assert detail["tool_slug"] == "playwright-mcp"
    assert detail["page_path"] == "/tools/playwright-mcp"
    assert detail["section"] == "基本信息"
    assert detail["field"] == "summary"
    assert detail["change_type"] == "updated"
    assert detail["before"] == "Old summary"
    assert detail["after"] == "Updated summary"


def test_import_records_guide_content_change_detail(db_session):
    first = _payload()
    second = _payload()
    second.tools[0].guides[0].content_markdown = "# Guide\n\nUpdated usage content"

    import_tool_payload(db_session, first)
    import_tool_payload(db_session, second, remove_missing=True)

    batch = db_session.query(ImportBatch).order_by(ImportBatch.id.desc()).first()
    details = batch.raw_payload["changes"][0]["change_details"]
    assert any(
        detail["tool_slug"] == "playwright-mcp"
        and detail["page_path"] == "/tools/playwright-mcp"
        and detail["section"] == "使用指南"
        and detail["field"] == "guides.使用指南.content_markdown"
        and detail["change_type"] == "updated"
        for detail in details
    )


def test_import_generates_page_content_for_visible_pages(db_session):
    payload = _payload()
    import_tool_payload(db_session, payload)

    batch = db_session.query(ImportBatch).one()
    page_content = batch.raw_payload["page_content"]
    assert page_content["home_highlights"]
    assert page_content["workflows"]
    assert page_content["prompt_groups"]
    assert page_content["command_groups"]
    assert page_content["guide_choices"]
    assert any(
        tool["slug"] == "playwright-mcp"
        for workflow in page_content["workflows"]
        for tool in workflow["tools"]
    )


def test_import_records_page_content_change_detail(db_session):
    first = _payload()
    second = _payload()
    second.page_content = {
        "home_highlights": [],
        "workflows": [
            {
                "title": "Context research",
                "flow": "Context7 MCP 查公开文档 → Claude Code 更新工具指南。",
                "prompt": "用 Context7 MCP 查询公开文档并整理使用方式。",
                "tools": [{"name": "Playwright MCP", "slug": "playwright-mcp", "type": "mcp"}],
            }
        ],
        "tool_combinations": [],
        "prompt_groups": [],
        "command_groups": [],
        "guide_choices": [],
        "guide_workflow_tips": [],
        "guide_safety_notes": [],
    }

    import_tool_payload(db_session, first)
    import_tool_payload(db_session, second, remove_missing=True)

    batch = db_session.query(ImportBatch).order_by(ImportBatch.id.desc()).first()
    details = batch.raw_payload["changes"][0]["change_details"]
    assert any(
        detail["page_path"] == "/workflows"
        and detail["section"] == "推荐组合工作流"
        and detail["field"] == "page_content.workflows"
        and detail["change_type"] == "updated"
        for detail in details
    )


def test_import_records_deleted_tool_change_detail(db_session):
    first = _payload()
    second = ToolImportPayload.model_validate(
        {
            "source": "claude_local_scan",
            "generated_at": "2026-06-18T11:00:00+08:00",
            "tools": [],
        }
    )

    import_tool_payload(db_session, first)
    import_tool_payload(db_session, second, remove_missing=True)

    batch = db_session.query(ImportBatch).order_by(ImportBatch.id.desc()).first()
    details = batch.raw_payload["changes"][0]["change_details"]
    assert any(
        detail["tool_slug"] == "playwright-mcp"
        and detail["page_path"] == "/tools/playwright-mcp"
        and detail["section"] == "工具详情页"
        and detail["field"] == "tool"
        and detail["change_type"] == "deleted"
        for detail in details
    )
    assert any(
        detail["tool_slug"] == "playwright-mcp"
        and detail["page_path"] == "/tools"
        and detail["section"] == "工具卡片"
        and detail["field"] == "tool_card"
        and detail["change_type"] == "deleted"
        for detail in details
    )


def test_import_rejects_sensitive_payload_without_storing_secret(db_session):
    payload = _payload(summary="token=sk-live-sensitive-value")

    result = import_tool_payload(db_session, payload)

    assert result.created == 0
    assert result.updated == 0
    batch = db_session.query(ImportBatch).one()
    assert batch.status == "failed"
    assert "sk-live-sensitive-value" not in json.dumps(batch.raw_payload)
    assert db_session.query(Tool).count() == 0
