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
        "changes": [
            {
                "title": "补充 Playwright MCP 使用说明",
                "change_type": "guide_update",
                "description": "补充截图、控制台和 E2E 验收使用场景。",
                "tool_slugs": ["playwright-mcp"],
                "page_paths": ["/tools/playwright-mcp", "/workflows"],
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
    assert entry["changes"][0]["title"] == "补充 Playwright MCP 使用说明"
    assert entry["affected_tools"][0]["slug"] == "playwright-mcp"
    assert entry["guide_count"] == 1


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
