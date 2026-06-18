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
