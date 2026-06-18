from dataclasses import dataclass
import re
from typing import Any

from sqlalchemy.orm import Session

from app.models import Category, Guide, ImportBatch, Tag, Tool
from app.schemas.import_payload import ImportPreviewResult, ToolImportPayload
from app.services.sensitive_scan import find_sensitive_findings


@dataclass(frozen=True)
class ImportResult:
    created: int
    updated: int
    import_id: int


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9一-鿿]+", "-", value.strip().lower()).strip("-")
    return slug or "item"


def preview_tool_payload(payload: ToolImportPayload) -> ImportPreviewResult:
    categories = {category for tool in payload.tools for category in tool.categories}
    tags = {tag for tool in payload.tools for tag in tool.tags}
    guides = sum(len(tool.guides) for tool in payload.tools)
    findings = [finding.__dict__ for finding in find_sensitive_findings(payload.model_dump())]
    return ImportPreviewResult(
        tool_count=len(payload.tools),
        guide_count=guides,
        category_count=len(categories),
        tag_count=len(tags),
        sensitive_findings=findings,
    )


def _get_or_create_category(db: Session, name: str) -> Category:
    slug = slugify(name)
    category = db.query(Category).filter_by(slug=slug).one_or_none()
    if category is None:
        category = Category(name=name, slug=slug)
        db.add(category)
        db.flush()
    return category


def _get_or_create_tag(db: Session, name: str) -> Tag:
    slug = slugify(name)
    tag = db.query(Tag).filter_by(slug=slug).one_or_none()
    if tag is None:
        tag = Tag(name=name, slug=slug)
        db.add(tag)
        db.flush()
    return tag


def _safe_failed_payload(payload: ToolImportPayload, preview: ImportPreviewResult) -> dict[str, Any]:
    return {
        "source": payload.source,
        "generated_at": payload.generated_at,
        "tool_count": preview.tool_count,
        "sensitive_findings": preview.sensitive_findings,
    }


def import_tool_payload(db: Session, payload: ToolImportPayload) -> ImportResult:
    preview = preview_tool_payload(payload)
    if preview.sensitive_findings:
        batch = ImportBatch(
            source=payload.source,
            status="failed",
            summary="Sensitive content detected",
            raw_payload=_safe_failed_payload(payload, preview),
        )
        db.add(batch)
        db.commit()
        return ImportResult(created=0, updated=0, import_id=batch.id)

    created = 0
    updated = 0
    for item in payload.tools:
        tool = db.query(Tool).filter_by(slug=item.slug).one_or_none()
        if tool is None:
            tool = Tool(name=item.name, slug=item.slug, type=item.type, status=item.status)
            created += 1
            db.add(tool)
        else:
            updated += 1

        tool.name = item.name
        tool.type = item.type
        tool.status = item.status
        tool.summary = item.summary
        tool.homepage_url = item.homepage_url
        tool.install_command = item.install_command
        tool.verify_command = item.verify_command
        tool.visibility = item.visibility
        tool.is_skill_candidate = item.is_skill_candidate
        tool.is_runbook_candidate = item.is_runbook_candidate
        tool.categories = [_get_or_create_category(db, name) for name in item.categories]
        tool.tags = [_get_or_create_tag(db, name) for name in item.tags]
        tool.guides.clear()
        for guide in item.guides:
            tool.guides.append(
                Guide(
                    title=guide.title,
                    guide_type=guide.guide_type,
                    visibility=guide.visibility,
                    content_markdown=guide.content_markdown,
                )
            )

    batch = ImportBatch(
        source=payload.source,
        status="imported",
        summary=f"created={created}, updated={updated}",
        raw_payload=payload.model_dump(),
    )
    db.add(batch)
    db.commit()
    return ImportResult(created=created, updated=updated, import_id=batch.id)
