from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app
from app.models import ImportBatch


def _token(client: TestClient) -> str:
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "toolvault-admin-local"},
    )
    return response.json()["access_token"]


def _payload(source="first-source", generated_at="2026-06-18T10:00:00+08:00", private=False):
    return {
        "source": source,
        "generated_at": generated_at,
        "sources": [
            {
                "title": "Playwright MCP 官方文档",
                "url": "https://github.com/microsoft/playwright-mcp",
                "source_type": "official_docs",
                "checked_at": "2026-06-23T08:57:00+08:00",
                "note": "用于确认浏览器自动化能力。",
            }
        ],
        "content_plan": [
            {
                "page_path": "/tools/{slug}",
                "page_name": "工具详情页",
                "section": "使用指南",
                "required_content": ["说明安装后怎么使用", "说明能帮助用户做什么"],
                "tool_slugs": ["playwright-mcp"],
                "status": "planned",
            }
        ],
        "changes": [
            {
                "title": "补充 Playwright MCP 使用说明",
                "change_type": "guide_update",
                "description": "补充截图、控制台和 E2E 验收使用场景。",
                "tool_slugs": ["playwright-mcp"],
                "page_paths": ["/tools/playwright-mcp", "/workflows"],
                "change_details": [
                    {
                        "tool_slug": "playwright-mcp",
                        "tool_name": "Playwright MCP",
                        "page_path": "/tools/playwright-mcp",
                        "section": "使用指南",
                        "field": "guides.使用指南.content_markdown",
                        "change_type": "updated",
                        "before": "# Guide",
                        "after": "# Guide\n\n补充截图、控制台和 E2E 验收使用场景。",
                        "source_titles": ["Playwright MCP 官方文档"],
                    }
                ],
            }
        ],
        "tools": [
            {
                "name": "Playwright MCP",
                "slug": "playwright-mcp",
                "type": "mcp",
                "status": "configured",
                "summary": "Browser automation",
                "visibility": "login_required" if private else "public",
                "categories": ["测试工具"],
                "tags": ["playwright"],
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


def test_update_logs_return_successful_import_summary():
    client = TestClient(app)
    token = _token(client)

    import_response = client.post(
        "/api/admin/imports/tools",
        json=_payload(),
        headers={"Authorization": f"Bearer {token}"},
    )
    assert import_response.status_code == 200

    response = client.get("/api/update-logs")

    assert response.status_code == 200
    entry = response.json()[0]
    assert entry["source"] == "first-source"
    assert entry["generated_at"] == "2026-06-18T10:00:00+08:00"
    assert entry["status"] == "imported"
    assert entry["validation"]["status"] == "passed"
    assert entry["validation"]["sensitive_findings_count"] == 0
    assert entry["sources"][0]["title"] == "Playwright MCP 官方文档"
    assert entry["content_plan"][0]["page_path"] == "/tools/{slug}"
    assert entry["content_plan"][0]["required_content"] == ["说明安装后怎么使用", "说明能帮助用户做什么"]
    assert entry["changes"][0]["title"] == "补充 Playwright MCP 使用说明"
    assert entry["changes"][0]["change_details"][0]["page_path"] == "/tools/playwright-mcp"
    assert entry["changes"][0]["change_details"][0]["field"] == "guides.使用指南.content_markdown"
    assert entry["affected_tools"][0]["slug"] == "playwright-mcp"
    assert entry["guide_count"] == 1
    assert entry["execution_report"][0].startswith("结果：status=imported import_id=")
    assert any(line.startswith("质量结论：") for line in entry["execution_report"])


def test_update_logs_return_collapsible_execution_report(db_session):
    db_session.add(
        ImportBatch(
            source="daily-source",
            status="imported",
            summary="created=0, updated=1",
            raw_payload={
                "source": "daily-source",
                "generated_at": "2026-06-23T22:25:41+08:00",
                "tools": [],
                "execution_report": [
                    "结果：status=imported import_id=16 created=0 updated=17",
                    "API 抽查：/api/update-logs 实际有 change_details=12",
                    "质量结论：页面展示质量通过，命令行报告口径需要后续修正。",
                ],
            },
        )
    )
    db_session.commit()
    client = TestClient(app)

    response = client.get("/api/update-logs")

    assert response.status_code == 200
    entry = response.json()[0]
    assert entry["execution_report"] == [
        "结果：status=imported import_id=16 created=0 updated=17",
        "API 抽查：/api/update-logs 实际有 change_details=12",
        "质量结论：页面展示质量通过，命令行报告口径需要后续修正。",
    ]


def test_update_log_time_is_returned_in_beijing_timezone(db_session):
    db_session.add(
        ImportBatch(
            source="time-source",
            status="imported",
            summary="created=0, updated=0",
            created_at=datetime(2026, 6, 23, 5, 10, 20),
            raw_payload={"source": "time-source", "generated_at": "2026-06-23T13:10:20+08:00", "tools": []},
        )
    )
    db_session.commit()
    client = TestClient(app)

    response = client.get("/api/update-logs")

    assert response.status_code == 200
    assert response.json()[0]["update_time"] == "2026-06-23T13:10:20+08:00"


def test_update_logs_return_empty_content_plan_and_change_details_for_legacy_logs(db_session):
    db_session.add(
        ImportBatch(
            source="legacy-source",
            status="imported",
            summary="created=0, updated=0",
            raw_payload={
                "source": "legacy-source",
                "generated_at": "2026-06-18T10:00:00+08:00",
                "changes": [
                    {
                        "title": "Legacy change",
                        "change_type": "legacy",
                        "description": "Before content planning existed.",
                        "tool_slugs": [],
                        "page_paths": ["/updates"],
                    }
                ],
                "tools": [],
            },
        )
    )
    db_session.commit()
    client = TestClient(app)

    response = client.get("/api/update-logs")

    assert response.status_code == 200
    entry = response.json()[0]
    assert entry["content_plan"] == []
    assert entry["changes"][0]["change_details"] == []


def test_update_logs_are_newest_first():
    client = TestClient(app)
    token = _token(client)

    client.post("/api/admin/imports/tools", json=_payload(source="older"), headers={"Authorization": f"Bearer {token}"})
    client.post("/api/admin/imports/tools", json=_payload(source="newer"), headers={"Authorization": f"Bearer {token}"})

    response = client.get("/api/update-logs")

    assert response.status_code == 200
    assert [entry["source"] for entry in response.json()[:2]] == ["newer", "older"]


def test_update_logs_do_not_expose_private_tools():
    client = TestClient(app)
    token = _token(client)

    client.post("/api/admin/imports/tools", json=_payload(private=True), headers={"Authorization": f"Bearer {token}"})

    response = client.get("/api/update-logs")

    assert response.status_code == 200
    assert response.json()[0]["affected_tools"] == []


def test_update_logs_hide_sensitive_failure_details(db_session):
    db_session.add(
        ImportBatch(
            source="failed-source",
            status="failed",
            summary="Sensitive content detected",
            raw_payload={
                "source": "failed-source",
                "generated_at": "2026-06-18T10:00:00+08:00",
                "tool_count": 1,
                "sensitive_findings": [
                    {"path": "tools.0.summary", "kind": "api_key", "match": "sk-live-sensitive-value"}
                ],
            },
        )
    )
    db_session.commit()
    client = TestClient(app)

    response = client.get("/api/update-logs")

    assert response.status_code == 200
    entry = response.json()[0]
    assert entry["status"] == "failed"
    assert entry["validation"]["status"] == "failed"
    assert entry["validation"]["sensitive_findings_count"] == 1
    assert "sk-live-sensitive-value" not in str(entry)
