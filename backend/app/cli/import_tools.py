from dataclasses import asdict, dataclass
import json
import sys
from pathlib import Path

from app.core.database import SessionLocal
from app.schemas.import_payload import ImportPreviewResult, ToolImportPayload
from app.services.import_tools import ImportResult, import_tool_payload, preview_tool_payload


@dataclass(frozen=True)
class ImportRunResult:
    payload: ToolImportPayload
    preview: ImportPreviewResult
    result: ImportResult


def run_import_payload(payload: ToolImportPayload, session_factory=None, remove_missing: bool = False) -> ImportRunResult:
    preview = preview_tool_payload(payload)
    with (session_factory or SessionLocal)() as session:
        result = import_tool_payload(session, payload, remove_missing=remove_missing)
    return ImportRunResult(payload=payload, preview=preview, result=result)


def run_import(payload_path: Path, session_factory=None, remove_missing: bool = False) -> ImportRunResult:
    payload = ToolImportPayload.model_validate(json.loads(payload_path.read_text(encoding="utf-8")))
    return run_import_payload(payload, session_factory, remove_missing=remove_missing)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python -m app.cli.import_tools <path-to-json>")
        return 2
    run = run_import(Path(sys.argv[1]))
    if run.preview.sensitive_findings:
        print(json.dumps(run.preview.model_dump(), ensure_ascii=False, indent=2))
        return 1
    print(json.dumps(asdict(run.result), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
