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
        changes=[UpdateLogChangeRead.model_validate(change) for change in _as_list(batch.raw_payload.get("changes"))],
        execution_report=_as_string_list(batch.raw_payload.get("execution_report")),
        affected_tools=_public_tools(db, raw_tools),
        guide_count=sum(len(_as_list(tool.get("guides"))) for tool in raw_tools),
        validation=_validation_for(batch),
    )


@router.get("", response_model=list[UpdateLogEntryRead])
def list_update_logs(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_session)):
    batches = db.query(ImportBatch).order_by(ImportBatch.id.desc()).limit(limit).all()
    return [_entry_from_batch(db, batch) for batch in batches]
