from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_session
from app.models import Tool
from app.schemas.tool import GuideRead, ToolRead

router = APIRouter(prefix="/api/tools", tags=["public-tools"])


def _public_query(db: Session):
    return (
        db.query(Tool)
        .options(selectinload(Tool.categories), selectinload(Tool.tags), selectinload(Tool.guides))
        .filter(Tool.visibility == "public")
        .order_by(Tool.name.asc())
    )


def _public_tool_read(tool: Tool) -> ToolRead:
    return ToolRead.model_validate(tool).model_copy(
        update={
            "guides": [
                GuideRead.model_validate(guide)
                for guide in tool.guides
                if guide.visibility == "public"
            ]
        }
    )


@router.get("", response_model=list[ToolRead])
def list_public_tools(q: str = "", type: str = "", db: Session = Depends(get_session)):
    query = _public_query(db)
    if q:
        query = query.filter(Tool.name.contains(q))
    if type:
        query = query.filter(Tool.type == type)
    return [_public_tool_read(tool) for tool in query.all()]


@router.get("/{slug}", response_model=ToolRead)
def get_public_tool(slug: str, db: Session = Depends(get_session)):
    tool = _public_query(db).filter(Tool.slug == slug).one_or_none()
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    return _public_tool_read(tool)
