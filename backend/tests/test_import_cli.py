from contextlib import nullcontext
import json
import sys

from app.models import ImportBatch


def test_import_cli_rejects_sensitive_payload(tmp_path, monkeypatch, capsys, db_session):
    payload_path = tmp_path / "payload.json"
    payload_path.write_text(
        json.dumps(
            {
                "source": "cli-test",
                "generated_at": "2026-06-18T10:00:00+08:00",
                "tools": [
                    {
                        "name": "Sensitive Tool",
                        "slug": "sensitive-tool",
                        "type": "cli",
                        "status": "configured",
                        "summary": "token=sk-live-sensitive-value",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(sys, "argv", ["python -m app.cli.import_tools", str(payload_path)])

    from app.cli import import_tools as import_tools_cli

    monkeypatch.setattr(import_tools_cli, "SessionLocal", lambda: nullcontext(db_session))
    main = import_tools_cli.main

    exit_code = main()

    captured = capsys.readouterr()
    assert exit_code == 1
    assert '"tool_count": 1' in captured.out
    assert '"sensitive_findings"' in captured.out
    batch = db_session.query(ImportBatch).one()
    assert batch.status == "failed"
    assert "sk-live-sensitive-value" not in json.dumps(batch.raw_payload)
