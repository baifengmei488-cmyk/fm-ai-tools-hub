from fastapi.testclient import TestClient

from app.main import app


def _token(client: TestClient) -> str:
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "toolvault-admin-local"},
    )
    return response.json()["access_token"]


def test_admin_can_import_and_public_can_read_public_tool():
    client = TestClient(app)
    token = _token(client)
    payload = {
        "source": "claude_local_scan",
        "generated_at": "2026-06-18T10:00:00+08:00",
        "tools": [
            {
                "name": "OpenSpec",
                "slug": "openspec",
                "type": "cli_tool",
                "status": "installed",
                "summary": "规格驱动开发工具",
                "visibility": "public",
                "categories": ["开发工具"],
                "tags": ["spec"],
                "guides": [
                    {
                        "title": "使用指南",
                        "guide_type": "usage",
                        "visibility": "public",
                        "content_markdown": "# OpenSpec",
                    }
                ],
            }
        ],
    }

    import_response = client.post(
        "/api/admin/imports/tools",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert import_response.status_code == 200
    list_response = client.get("/api/tools")
    assert list_response.status_code == 200
    assert list_response.json()[0]["slug"] == "openspec"
    detail_response = client.get("/api/tools/openspec")
    assert detail_response.status_code == 200
    assert detail_response.json()["guides"][0]["title"] == "使用指南"


def test_private_tool_is_hidden_from_public_list():
    client = TestClient(app)
    token = _token(client)
    payload = {
        "source": "claude_local_scan",
        "generated_at": "2026-06-18T10:00:00+08:00",
        "tools": [
            {
                "name": "Private Runbook",
                "slug": "private-runbook",
                "type": "skill",
                "status": "draft",
                "summary": "Internal workflow",
                "visibility": "login_required",
                "categories": [],
                "tags": [],
                "guides": [],
            }
        ],
    }

    client.post(
        "/api/admin/imports/tools",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert client.get("/api/tools/private-runbook").status_code == 404
    admin_response = client.get(
        "/api/admin/tools/private-runbook",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert admin_response.status_code == 200
