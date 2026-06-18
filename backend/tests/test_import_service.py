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


def test_import_rejects_sensitive_payload_without_storing_secret(db_session):
    payload = _payload(summary="token=sk-live-sensitive-value")

    result = import_tool_payload(db_session, payload)

    assert result.created == 0
    assert result.updated == 0
    batch = db_session.query(ImportBatch).one()
    assert batch.status == "failed"
    assert "sk-live-sensitive-value" not in json.dumps(batch.raw_payload)
    assert db_session.query(Tool).count() == 0
