import json
import sys
from pathlib import Path

from app.core.database import SessionLocal
from app.schemas.import_payload import ToolImportPayload
from app.services.import_tools import import_tool_payload, preview_tool_payload


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python -m app.cli.import_tools <path-to-json>")
        return 2
    payload_path = Path(sys.argv[1])
    payload = ToolImportPayload.model_validate(json.loads(payload_path.read_text(encoding="utf-8")))
    preview = preview_tool_payload(payload)
    with SessionLocal() as session:
        result = import_tool_payload(session, payload)
    if preview.sensitive_findings:
        print(json.dumps(preview.model_dump(), ensure_ascii=False, indent=2))
        return 1
    print(json.dumps(result.__dict__, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
