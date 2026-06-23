from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_session
from app.models import ImportBatch, Tool
from app.schemas.page_content import PageContentRead
from app.services.import_tools import _default_page_content

router = APIRouter(prefix="/api/page-content", tags=["page-content"])


def _sanitize_tool_ref(ref: dict[str, Any], public_slugs: set[str]) -> dict[str, str]:
    slug = ref.get("slug") if isinstance(ref.get("slug"), str) else ""
    return {
        "name": str(ref.get("name", slug)),
        "slug": slug if slug in public_slugs else "",
        "type": str(ref.get("type", "")),
    }


def _sanitize_tool_refs(items: list[dict[str, Any]], public_slugs: set[str]) -> list[dict[str, Any]]:
    return [
        {
            **item,
            "tools": [_sanitize_tool_ref(tool, public_slugs) for tool in item.get("tools", []) if isinstance(tool, dict)],
        }
        for item in items
        if isinstance(item, dict)
    ]


def _sanitize_page_content(page_content: dict[str, Any], public_slugs: set[str]) -> dict[str, Any]:
    return {
        "home_highlights": _sanitize_tool_refs(page_content.get("home_highlights", []), public_slugs),
        "workflows": _sanitize_tool_refs(page_content.get("workflows", []), public_slugs),
        "tool_combinations": _sanitize_tool_refs(page_content.get("tool_combinations", []), public_slugs),
        "prompt_groups": _sanitize_tool_refs(page_content.get("prompt_groups", []), public_slugs),
        "command_groups": _sanitize_tool_refs(page_content.get("command_groups", []), public_slugs),
        "guide_choices": _sanitize_tool_refs(page_content.get("guide_choices", []), public_slugs),
        "guide_workflow_tips": _sanitize_tool_refs(page_content.get("guide_workflow_tips", []), public_slugs),
        "guide_safety_notes": page_content.get("guide_safety_notes", []) if isinstance(page_content.get("guide_safety_notes"), list) else [],
    }


@router.get("", response_model=PageContentRead)
def get_page_content(db: Session = Depends(get_session)):
    batch = db.query(ImportBatch).filter_by(status="imported").order_by(ImportBatch.id.desc()).first()
    raw_payload = batch.raw_payload if batch is not None else {"tools": []}
    page_content = raw_payload.get("page_content") if isinstance(raw_payload.get("page_content"), dict) else _default_page_content(raw_payload)
    public_slugs = {slug for (slug,) in db.query(Tool.slug).filter(Tool.visibility == "public").all()}
    if not public_slugs:
        public_slugs = {
            tool.get("slug")
            for tool in raw_payload.get("tools", [])
            if isinstance(tool, dict) and tool.get("visibility", "public") == "public" and isinstance(tool.get("slug"), str)
        }
    return PageContentRead.model_validate(_sanitize_page_content(page_content, public_slugs))
