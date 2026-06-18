import pytest
from pydantic import ValidationError

from app.schemas.import_payload import ToolImportPayload
from app.services.sensitive_scan import find_sensitive_findings


def test_sensitive_scan_flags_real_password_assignment():
    payload = {
        "tools": [
            {
                "name": "Database",
                "install_command": "mysql -u root -pSuperSecret123",
            }
        ]
    }

    findings = find_sensitive_findings(payload)

    assert findings
    assert findings[0].path == "tools[0].install_command"


def test_sensitive_scan_allows_documentation_placeholders():
    payload = {
        "tools": [
            {
                "name": "GitHub MCP",
                "install_command": "claude mcp add github -e GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_TOKEN",
                "summary": "Use readonly_user and your_password placeholders in docs.",
            }
        ]
    }

    assert find_sensitive_findings(payload) == []


def test_sensitive_scan_allows_benign_long_dash_flags_starting_with_p():
    payload = {
        "tools": [
            {
                "name": "Database",
                "install_command": "toolvault db connect --port 5433 --project toolvault --profile local",
            }
        ]
    }

    assert find_sensitive_findings(payload) == []


def test_import_payload_rejects_extra_fields_before_secret_scanning():
    payload = {
        "source": "test",
        "generated_at": "2026-06-18T00:00:00Z",
        "tools": [
            {
                "name": "GitHub MCP",
                "slug": "github-mcp",
                "type": "mcp",
                "status": "active",
                "env": {"GITHUB_TOKEN": "ghp_real"},
            }
        ],
    }

    with pytest.raises(ValidationError):
        ToolImportPayload.model_validate(payload)


def test_sensitive_scan_flags_pem_private_key_block_in_markdown():
    payload = {
        "tools": [
            {
                "name": "Key Guide",
                "guides": [
                    {
                        "content_markdown": "Store this safely:\n-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
                    }
                ],
            }
        ]
    }

    findings = find_sensitive_findings(payload)

    assert len(findings) == 1
    assert findings[0].path == "tools[0].guides[0].content_markdown"
    assert "private key" in findings[0].reason


def test_sensitive_scan_flags_github_token_in_markdown():
    payload = {
        "tools": [
            {
                "name": "GitHub Guide",
                "guides": [
                    {
                        "content_markdown": "Use ghp_1234567890abcdef1234567890abcdef1234 for local testing.",
                    }
                ],
            }
        ]
    }

    findings = find_sensitive_findings(payload)

    assert findings
    assert findings[0].path == "tools[0].guides[0].content_markdown"
    assert "github token" in findings[0].reason


def test_sensitive_scan_flags_bearer_token_in_prose():
    payload = {
        "tools": [
            {
                "name": "API Guide",
                "summary": "Paste Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.real.token into curl.",
            }
        ]
    }

    findings = find_sensitive_findings(payload)

    assert findings
    assert findings[0].path == "tools[0].summary"
    assert "bearer token" in findings[0].reason


def test_sensitive_scan_flags_nested_sensitive_key_path():
    payload = {"tools": [{"config": {"secret": "real-secret"}}]}

    findings = find_sensitive_findings(payload)

    assert findings
    assert findings[0].path == "tools[0].config.secret"
