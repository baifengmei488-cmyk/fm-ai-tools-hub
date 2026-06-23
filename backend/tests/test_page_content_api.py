from fastapi.testclient import TestClient

from app.main import app
from app.models import ImportBatch


def _token(client: TestClient) -> str:
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "toolvault-admin-local"},
    )
    return response.json()["access_token"]


def _tool(slug="context7-mcp", name="Context7 MCP", visibility="public"):
    return {
        "name": name,
        "slug": slug,
        "type": "mcp_server",
        "status": "configured",
        "summary": "公开文档上下文查询工具。",
        "visibility": visibility,
        "categories": ["MCP 服务"],
        "tags": ["context7"],
        "guides": [
            {
                "title": "使用指南",
                "guide_type": "usage",
                "visibility": "public",
                "content_markdown": "# Context7 MCP 使用指南\n\n安装后可以查询公开库文档并补充工具指南。",
            }
        ],
    }


def _page_content(tool_slug="context7-mcp", tool_name="Context7 MCP"):
    tool_ref = {"name": tool_name, "slug": tool_slug, "type": "mcp_server"}
    return {
        "home_highlights": [
            {
                "title": "公开文档查询",
                "description": "用 Context7 MCP 查询公开库文档，再更新 FM AI Tools Hub 指南。",
                "tools": [tool_ref],
            }
        ],
        "workflows": [
            {
                "title": "文档上下文补全",
                "flow": "Context7 MCP 查询公开文档 → Claude Code 整理使用指南。",
                "prompt": "用 Context7 MCP 查询这个库的公开文档，并补充工具详情页。",
                "tools": [tool_ref],
            }
        ],
        "tool_combinations": [],
        "prompt_groups": [
            {
                "title": "资料查询",
                "description": "查询公开文档并生成指南。",
                "tools": [tool_ref],
                "prompts": ["用 Context7 MCP 查询这个工具的公开文档，整理成使用指南。"],
            }
        ],
        "command_groups": [
            {
                "title": "Context7 MCP",
                "tools": [tool_ref],
                "commands": ["claude mcp get context7"],
                "note": "只查询公开授权文档，不处理私有 token。",
            }
        ],
        "guide_choices": [
            {"need": "查询公开库文档和用法", "tools": [tool_ref]}
        ],
        "guide_workflow_tips": [
            {
                "scenario": "工具指南缺少官方用法",
                "tools": [tool_ref],
                "suggestion": "先查询公开文档，再补充详情页和工作流。",
            }
        ],
        "guide_safety_notes": ["只查询公开或授权资料，不保存密钥。"],
    }


def test_page_content_api_returns_latest_imported_content():
    client = TestClient(app)
    token = _token(client)
    payload = {
        "source": "page-content-test",
        "generated_at": "2026-06-23T12:00:00+08:00",
        "page_content": _page_content(),
        "tools": [_tool()],
    }

    import_response = client.post(
        "/api/admin/imports/tools",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert import_response.status_code == 200

    response = client.get("/api/page-content")

    assert response.status_code == 200
    data = response.json()
    assert data["workflows"][0]["title"] == "文档上下文补全"
    assert data["workflows"][0]["tools"][0]["slug"] == "context7-mcp"
    assert data["command_groups"][0]["commands"] == ["claude mcp get context7"]
    assert data["prompt_groups"][0]["prompts"][0] == "用 Context7 MCP 查询这个工具的公开文档，整理成使用指南。"


def test_page_content_api_falls_back_for_legacy_imports(db_session):
    db_session.add(
        ImportBatch(
            source="legacy-source",
            status="imported",
            summary="created=1, updated=0",
            raw_payload={
                "source": "legacy-source",
                "generated_at": "2026-06-23T12:00:00+08:00",
                "tools": [_tool(slug="playwright-mcp", name="Playwright MCP")],
            },
        )
    )
    db_session.commit()
    client = TestClient(app)

    response = client.get("/api/page-content")

    assert response.status_code == 200
    data = response.json()
    assert data["workflows"]
    assert any(
        tool["slug"] == "playwright-mcp"
        for workflow in data["workflows"]
        for tool in workflow["tools"]
    )


def test_page_content_api_does_not_link_private_tools():
    client = TestClient(app)
    token = _token(client)
    payload = {
        "source": "page-content-test",
        "generated_at": "2026-06-23T12:00:00+08:00",
        "page_content": _page_content("private-runbook", "Private Runbook"),
        "tools": [_tool(slug="private-runbook", name="Private Runbook", visibility="login_required")],
    }

    import_response = client.post(
        "/api/admin/imports/tools",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert import_response.status_code == 200

    response = client.get("/api/page-content")

    assert response.status_code == 200
    data = response.json()
    assert data["workflows"][0]["tools"] == [{"name": "Private Runbook", "slug": "", "type": "mcp_server"}]
