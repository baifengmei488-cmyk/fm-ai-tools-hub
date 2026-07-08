from datetime import UTC
from typing import Any
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.models import ImportBatch, Tool
from app.schemas.update_log import (
    UpdateLogChangeRead,
    UpdateLogContentPlanItemRead,
    UpdateLogEntryRead,
    UpdateLogSourceRead,
    UpdateLogToolRead,
    UpdateLogValidationRead,
)
from app.services.import_tools import _change_summary, _guide_map, _payload_tools_by_slug, parse_guide_content_field

router = APIRouter(prefix="/api/update-logs", tags=["update-logs"])
BEIJING_TZ = ZoneInfo("Asia/Shanghai")


def _as_list(value: Any) -> list[dict[str, Any]]:
    return value if isinstance(value, list) else []


def _as_string_list(value: Any) -> list[str]:
    return [item for item in value] if isinstance(value, list) and all(isinstance(item, str) for item in value) else []


def _validation_for(batch: ImportBatch) -> UpdateLogValidationRead:
    findings = _as_list(batch.raw_payload.get("sensitive_findings"))
    if batch.status == "failed":
        return UpdateLogValidationRead(
            status="failed",
            message="Sensitive content detected; raw details are hidden.",
            sensitive_findings_count=len(findings),
        )
    return UpdateLogValidationRead(status="passed", message="Validation passed", sensitive_findings_count=0)


def _beijing_time(value) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(BEIJING_TZ).isoformat()


def _public_tools(db: Session, raw_tools: list[dict[str, Any]]) -> list[UpdateLogToolRead]:
    slugs = [tool.get("slug") for tool in raw_tools if isinstance(tool.get("slug"), str)]
    if not slugs:
        return []

    tools = db.query(Tool).filter(Tool.slug.in_(slugs), Tool.visibility == "public").all()
    by_slug = {tool.slug: tool for tool in tools}
    return [
        UpdateLogToolRead(name=tool.name, slug=tool.slug, type=tool.type, status=tool.status)
        for slug in slugs
        if (tool := by_slug.get(slug)) is not None
    ]


def _guide_content(tool: dict[str, Any], title: str) -> str:
    for (guide_title, _guide_type), guide in _guide_map(tool).items():
        if guide_title == title:
            return str(guide.get("content_markdown", ""))
    return ""


def _has_legacy_guide_summary_repair_candidate(changes: list[dict[str, Any]]) -> bool:
    for change in changes:
        for detail in _as_list(change.get("change_details")):
            field = detail.get("field")
            if isinstance(field, str) and parse_guide_content_field(field) is not None and detail.get("before") == detail.get("after"):
                return True
    return False


def _repair_legacy_change_details(db: Session, batch: ImportBatch) -> list[dict[str, Any]]:
    changes = _as_list(batch.raw_payload.get("changes"))
    if not _has_legacy_guide_summary_repair_candidate(changes):
        return changes

    previous_batch = db.query(ImportBatch).filter(ImportBatch.id < batch.id, ImportBatch.status == "imported").order_by(ImportBatch.id.desc()).first()
    if previous_batch is None:
        return changes

    previous_tools = _payload_tools_by_slug(previous_batch.raw_payload)
    current_tools = _payload_tools_by_slug(batch.raw_payload)
    repaired_changes: list[dict[str, Any]] = []
    for change in changes:
        repaired_details = []
        for detail in _as_list(change.get("change_details")):
            field = detail.get("field")
            slug = detail.get("tool_slug")
            title = parse_guide_content_field(field) if isinstance(field, str) else None
            if title is not None and isinstance(slug, str) and detail.get("before") == detail.get("after"):
                before_summary, after_summary = _change_summary(
                    _guide_content(previous_tools.get(slug, {}), title),
                    _guide_content(current_tools.get(slug, {}), title),
                )
                if before_summary != after_summary:
                    detail = {**detail, "before": before_summary, "after": after_summary}
            repaired_details.append(detail)
        repaired_changes.append({**change, "change_details": repaired_details})
    return repaired_changes


def _entry_from_batch(db: Session, batch: ImportBatch) -> UpdateLogEntryRead:
    raw_tools = _as_list(batch.raw_payload.get("tools"))
    return UpdateLogEntryRead(
        id=batch.id,
        source=batch.source,
        status=batch.status,
        summary=batch.summary,
        update_time=_beijing_time(batch.created_at),
        generated_at=str(batch.raw_payload.get("generated_at", "")),
        content_plan=[UpdateLogContentPlanItemRead.model_validate(item) for item in _as_list(batch.raw_payload.get("content_plan"))],
        sources=[UpdateLogSourceRead.model_validate(source) for source in _as_list(batch.raw_payload.get("sources"))],
        changes=[UpdateLogChangeRead.model_validate(change) for change in _repair_legacy_change_details(db, batch)],
        execution_report=_as_string_list(batch.raw_payload.get("execution_report")),
        affected_tools=_public_tools(db, raw_tools),
        guide_count=sum(len(_as_list(tool.get("guides"))) for tool in raw_tools),
        validation=_validation_for(batch),
    )


@router.get("", response_model=list[UpdateLogEntryRead])
def list_update_logs(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_session)):
    batches = db.query(ImportBatch).order_by(ImportBatch.id.desc()).limit(limit).all()
    return [_entry_from_batch(db, batch) for batch in batches]
