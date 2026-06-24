from contextlib import nullcontext
import json

from app.models import ImportBatch


def _payload(summary="Browser automation"):
    return {
        "source": "daily-test",
        "generated_at": "2026-06-23T12:00:00+08:00",
        "sources": [
            {
                "title": "Manual daily run",
                "url": "",
                "source_type": "manual_scheduled_run",
                "checked_at": "2026-06-23T12:00:00+08:00",
                "note": "Safe local verification.",
            }
        ],
        "changes": [
            {
                "title": "Verify daily update entrypoint",
                "change_type": "validation",
                "description": "Verify shared manual and scheduled daily update command.",
                "tool_slugs": ["playwright-mcp"],
                "page_paths": ["/updates"],
            }
        ],
        "tools": [
            {
                "name": "Playwright MCP",
                "slug": "playwright-mcp",
                "type": "mcp",
                "status": "configured",
                "summary": summary,
                "visibility": "public",
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


def _write_payload(tmp_path, payload):
    tmp_path.mkdir(parents=True, exist_ok=True)
    payload_path = tmp_path / "payload.json"
    payload_path.write_text(json.dumps(payload), encoding="utf-8")
    return payload_path


def _page_content():
    tool_ref = {"name": "Playwright MCP", "slug": "playwright-mcp", "type": "mcp"}
    return {
        "home_highlights": [
            {
                "title": "保留的首页推荐",
                "description": "上一轮保留下来的首页推荐。",
                "tools": [tool_ref],
            }
        ],
        "workflows": [
            {
                "title": "保留的工作流",
                "flow": "上一轮工作流。",
                "prompt": "继续沿用上一轮提示。",
                "tools": [tool_ref],
            }
        ],
        "tool_combinations": [],
        "prompt_groups": [
            {
                "title": "保留的提示词组",
                "description": "上一轮提示词。",
                "tools": [tool_ref],
                "prompts": ["保留这条提示词。"],
            }
        ],
        "command_groups": [
            {
                "title": "保留的命令组",
                "tools": [tool_ref],
                "commands": ["claude mcp get playwright"],
                "note": "上一轮命令。",
            }
        ],
        "guide_choices": [{"need": "保留的导航选择", "tools": [tool_ref]}],
        "guide_workflow_tips": [
            {
                "scenario": "保留的导航场景",
                "tools": [tool_ref],
                "suggestion": "上一轮建议。",
            }
        ],
        "guide_safety_notes": ["保留上一轮安全说明。"],
    }


def test_daily_update_cli_imports_payload_and_verifies_update_log(tmp_path, monkeypatch, capsys, db_session):
    payload_path = _write_payload(tmp_path, _payload())

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))

    exit_code = daily_update.main(["--payload", str(payload_path)])

    captured = capsys.readouterr()
    batch = db_session.query(ImportBatch).one()
    assert exit_code == 0
    assert batch.status == "imported"
    assert f"import_id={batch.id}" in captured.out
    assert "created=1" in captured.out
    assert "updated=0" in captured.out
    assert "update_log_verified=true" in captured.out
    assert "Manual daily run" in captured.out
    assert "Verify daily update entrypoint" in captured.out
    assert batch.raw_payload["sources"][0]["title"] == "Manual daily run"
    assert batch.raw_payload["changes"][0]["title"] == "Verify daily update entrypoint"


def test_daily_update_cli_preserves_previous_page_content_when_payload_omits_it(tmp_path, monkeypatch, db_session):
    first_payload = _payload()
    first_payload["page_content"] = _page_content()
    second_payload = _payload(summary="Updated summary")
    first_path = _write_payload(tmp_path / "first", first_payload)
    second_path = _write_payload(tmp_path / "second", second_payload)

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))

    assert daily_update.main(["--payload", str(first_path)]) == 0
    assert daily_update.main(["--payload", str(second_path)]) == 0

    batch = db_session.query(ImportBatch).order_by(ImportBatch.id.desc()).first()
    assert batch.raw_payload["page_content"]["home_highlights"][0]["title"] == "保留的首页推荐"
    assert batch.raw_payload["page_content"]["workflows"][0]["title"] == "保留的工作流"
    assert batch.raw_payload["page_content"]["prompt_groups"][0]["title"] == "保留的提示词组"
    assert batch.raw_payload["page_content"]["command_groups"][0]["title"] == "保留的命令组"
    assert "保留上一轮安全说明。" in batch.raw_payload["page_content"]["guide_safety_notes"]


def test_daily_update_cli_records_added_updated_and_deleted_tools(tmp_path, monkeypatch, capsys, db_session):
    first_payload = _payload(summary="Old summary")
    first_payload["tools"].append(
        {
            "name": "Removed Tool",
            "slug": "removed-tool",
            "type": "cli",
            "status": "installed",
            "summary": "Will be removed",
            "visibility": "public",
            "categories": [],
            "tags": [],
            "guides": [],
        }
    )
    second_payload = _payload(summary="New summary")
    second_payload["tools"].append(
        {
            "name": "New Tool",
            "slug": "new-tool",
            "type": "mcp_server",
            "status": "configured",
            "summary": "Newly scanned tool",
            "visibility": "public",
            "categories": [],
            "tags": [],
            "guides": [],
        }
    )
    first_path = _write_payload(tmp_path / "first", first_payload)
    second_path = _write_payload(tmp_path / "second", second_payload)

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))

    assert daily_update.main(["--payload", str(first_path)]) == 0
    exit_code = daily_update.main(["--payload", str(second_path)])

    captured = capsys.readouterr()
    latest = db_session.query(ImportBatch).order_by(ImportBatch.id.desc()).first()
    assert exit_code == 0
    assert "added=new-tool" in captured.out
    assert "updated=playwright-mcp" in captured.out
    assert "deleted=removed-tool" in captured.out
    assert latest.raw_payload["changes"][0]["added_tool_slugs"] == ["new-tool"]
    assert latest.raw_payload["changes"][0]["updated_tool_slugs"] == ["playwright-mcp"]
    assert latest.raw_payload["changes"][0]["deleted_tool_slugs"] == ["removed-tool"]


def test_daily_update_cli_removes_stale_database_tools_not_in_latest_payload(tmp_path, monkeypatch, db_session):
    payload_path = _write_payload(tmp_path, _payload())

    from app.cli import daily_update
    from app.models import ImportBatch, Tool

    db_session.add(
        ImportBatch(
            source="previous-source",
            status="imported",
            summary="created=1, updated=0",
            raw_payload={"source": "previous-source", "generated_at": "2026-06-23T09:00:00+08:00", "tools": [_payload()["tools"][0]]},
        )
    )
    db_session.add(Tool(name="Stale Tool", slug="stale-tool", type="skill", status="enabled"))
    db_session.commit()

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))

    assert daily_update.main(["--payload", str(payload_path)]) == 0

    batch = db_session.query(ImportBatch).order_by(ImportBatch.id.desc()).first()
    assert batch.raw_payload["changes"][0]["deleted_tool_slugs"] == ["stale-tool"]
    assert db_session.query(Tool).filter_by(slug="stale-tool").one_or_none() is None


def test_daily_update_cli_removes_tools_missing_from_latest_payload(tmp_path, monkeypatch, db_session):
    first_payload = _payload()
    first_payload["tools"].append(
        {
            "name": "Removed Tool",
            "slug": "removed-tool",
            "type": "cli",
            "status": "installed",
            "summary": "Will be removed",
            "visibility": "public",
            "categories": [],
            "tags": [],
            "guides": [],
        }
    )
    second_payload = _payload()
    first_path = _write_payload(tmp_path / "first", first_payload)
    second_path = _write_payload(tmp_path / "second", second_payload)

    from app.cli import daily_update
    from app.models import Tool

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))

    assert daily_update.main(["--payload", str(first_path)]) == 0
    assert daily_update.main(["--payload", str(second_path)]) == 0

    assert db_session.query(Tool).filter_by(slug="removed-tool").one_or_none() is None


def test_daily_update_cli_scans_installed_mcp_and_plugins(tmp_path, monkeypatch, capsys, db_session):
    payload_path = _write_payload(tmp_path, _payload())

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))
    monkeypatch.setattr(
        daily_update,
        "scan_installed_tools",
        lambda: [
            daily_update.ScannedTool(name="Context7 MCP", slug="context7-mcp", type="mcp_server", status="configured"),
            daily_update.ScannedTool(name="UI UX Pro Max", slug="ui-ux-pro-max", type="skill", status="enabled"),
        ],
    )

    assert daily_update.main(["--payload", str(payload_path)]) == 0
    exit_code = daily_update.main(["--payload", str(payload_path), "--scan-installed"])

    captured = capsys.readouterr()
    batch = db_session.query(ImportBatch).order_by(ImportBatch.id.desc()).first()
    slugs = [tool["slug"] for tool in batch.raw_payload["tools"]]
    assert exit_code == 0
    assert "context7-mcp" in slugs
    assert "ui-ux-pro-max" in slugs
    context7 = next(tool for tool in batch.raw_payload["tools"] if tool["slug"] == "context7-mcp")
    ui_ux = next(tool for tool in batch.raw_payload["tools"] if tool["slug"] == "ui-ux-pro-max")
    context7_guide = context7["guides"][0]["content_markdown"]
    ui_ux_guide = ui_ux["guides"][0]["content_markdown"]
    assert context7_guide.startswith("# Context7 MCP 使用指南")
    assert "安装后怎么用" in context7_guide
    assert len(context7_guide) > 1600
    for heading in ["适合场景", "具体使用步骤", "常用提示词", "组合使用", "排错与验证", "安全边界"]:
        assert heading in context7_guide
    assert ui_ux_guide.startswith("# UI UX Pro Max 使用指南")
    assert "Claude Code 插件" in ui_ux_guide
    assert len(ui_ux_guide) > 1600
    for heading in ["适合场景", "具体使用步骤", "常用提示词", "组合使用", "排错与验证", "安全边界"]:
        assert heading in ui_ux_guide
    assert batch.raw_payload["page_content"]["command_groups"]
    assert any(
        tool["slug"] == "context7-mcp"
        for group in batch.raw_payload["page_content"]["command_groups"]
        for tool in group["tools"]
    )
    assert "page_content_sections=" in captured.out
    assert "changed_pages=" in captured.out
    assert batch.raw_payload["changes"][0]["added_tool_slugs"] == ["context7-mcp", "ui-ux-pro-max"]


def test_daily_update_cli_parses_marked_plugin_line():
    from app.cli import daily_update

    tool = daily_update._plugin_tool_from_line("❯ ui-ux-pro-max@ui-ux-pro-max-skill")

    assert tool == daily_update.ScannedTool(
        name="Ui Ux Pro Max",
        slug="ui-ux-pro-max",
        type="skill",
        status="enabled",
    )


def test_daily_update_cli_parses_plugin_scoped_mcp_name():
    from app.cli import daily_update

    tool = daily_update._mcp_tool_from_line(
        "plugin:figma:figma: https://mcp.figma.com/mcp (HTTP) - ! Needs authentication"
    )

    assert tool == daily_update.ScannedTool(
        name="Figma MCP",
        slug="figma-mcp",
        type="mcp_server",
        status="needs_authentication",
    )


def test_daily_update_cli_does_not_duplicate_existing_superpowers_plugin(tmp_path, monkeypatch, db_session):
    payload = _payload()
    payload["tools"].append(
        {
            "name": "Superpowers Skills",
            "slug": "superpowers-skills",
            "type": "skill",
            "status": "enabled",
            "summary": "Existing rich Superpowers guide.",
            "visibility": "public",
            "categories": [],
            "tags": [],
            "guides": [],
        }
    )
    payload_path = _write_payload(tmp_path, payload)

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))
    monkeypatch.setattr(
        daily_update,
        "scan_installed_tools",
        lambda: [daily_update.ScannedTool(name="Superpowers", slug="superpowers", type="skill", status="enabled")],
    )

    exit_code = daily_update.main(["--payload", str(payload_path), "--scan-installed"])

    batch = db_session.query(ImportBatch).one()
    slugs = [tool["slug"] for tool in batch.raw_payload["tools"]]
    assert exit_code == 0
    assert "superpowers-skills" in slugs
    assert "superpowers" not in slugs


def test_daily_update_cli_loads_content_plan_and_reports_detail_count(tmp_path, monkeypatch, capsys, db_session):
    payload_path = _write_payload(tmp_path / "payload", _payload())
    content_plan_path = tmp_path / "content-plan.json"
    content_plan_path.write_text(
        json.dumps(
            [
                {
                    "page_path": "/tools/{slug}",
                    "page_name": "工具详情页",
                    "section": "使用指南",
                    "required_content": ["说明安装后怎么使用", "说明能帮助用户做什么"],
                    "tool_slugs": ["playwright-mcp"],
                    "status": "planned",
                }
            ]
        ),
        encoding="utf-8",
    )

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))

    exit_code = daily_update.main(["--payload", str(payload_path), "--content-plan", str(content_plan_path)])

    captured = capsys.readouterr()
    batch = db_session.query(ImportBatch).one()
    assert exit_code == 0
    assert "content_plan_items=1" in captured.out
    assert "change_details=" in captured.out
    assert batch.raw_payload["content_plan"][0]["page_path"] == "/tools/{slug}"
    assert batch.raw_payload["content_plan"][0]["required_content"] == ["说明安装后怎么使用", "说明能帮助用户做什么"]


def test_daily_update_cli_stores_execution_report_in_update_log(tmp_path, monkeypatch, db_session):
    payload_path = _write_payload(tmp_path, _payload())

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))

    exit_code = daily_update.main(["--payload", str(payload_path)])

    batch = db_session.query(ImportBatch).one()
    report = batch.raw_payload["execution_report"]
    assert exit_code == 0
    assert report[0].startswith("结果：status=imported import_id=")
    assert "created=1" in report[0]
    assert "updated=0" in report[0]
    assert any(line.startswith("content_plan_items=") for line in report)
    assert any(line.startswith("change_details=") for line in report)
    assert any(line.startswith("page_content_sections=") for line in report)
    assert any(line.startswith("changed_pages=") for line in report)
    assert "update_log_verified=true" in report
    assert report[-1].startswith("质量结论：")


def test_daily_update_cli_returns_usage_error_for_explicit_missing_content_plan(tmp_path, capsys, db_session):
    payload_path = _write_payload(tmp_path, _payload())

    from app.cli import daily_update

    exit_code = daily_update.main(["--payload", str(payload_path), "--content-plan", str(tmp_path / "missing.json")])

    captured = capsys.readouterr()
    assert exit_code == 2
    assert "content_plan_missing" in captured.out
    assert db_session.query(ImportBatch).count() == 0


def test_daily_update_cli_rejects_sensitive_payload_without_printing_raw_secret(tmp_path, monkeypatch, capsys, db_session):
    payload_path = _write_payload(tmp_path, _payload(summary="token=sk-live-sensitive-value"))

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))

    exit_code = daily_update.main(["--payload", str(payload_path)])

    captured = capsys.readouterr()
    batch = db_session.query(ImportBatch).one()
    assert exit_code == 1
    assert batch.status == "failed"
    assert "sensitive_findings=1" in captured.out
    assert "sk-live-sensitive-value" not in captured.out
    assert "sk-live-sensitive-value" not in json.dumps(batch.raw_payload)


def test_daily_update_cli_returns_usage_error_for_missing_payload(tmp_path, capsys, db_session):
    from app.cli import daily_update

    exit_code = daily_update.main(["--payload", str(tmp_path / "missing.json")])

    captured = capsys.readouterr()
    assert exit_code == 2
    assert "payload_missing" in captured.out
    assert db_session.query(ImportBatch).count() == 0


def test_daily_update_cli_reports_failed_update_log_verification(tmp_path, monkeypatch, capsys, db_session):
    payload_path = _write_payload(tmp_path, _payload())

    from app.cli import daily_update

    monkeypatch.setattr(daily_update, "SessionLocal", lambda: nullcontext(db_session))
    monkeypatch.setattr(daily_update, "verify_update_log", lambda session, import_id: False)

    exit_code = daily_update.main(["--payload", str(payload_path)])

    captured = capsys.readouterr()
    assert exit_code == 3
    assert "update_log_verified=false" in captured.out
