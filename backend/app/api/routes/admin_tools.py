from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_session, require_admin
from app.models import Tool
from app.schemas.tool import ToolRead

router = APIRouter(prefix="/api/admin/tools", tags=["admin-tools"])


@router.get("", response_model=list[ToolRead])
def list_admin_tools(db: Session = Depends(get_session), admin: str = Depends(require_admin)):
    return (
        db.query(Tool)
        .options(selectinload(Tool.categories), selectinload(Tool.tags), selectinload(Tool.guides))
        .order_by(Tool.name.asc())
        .all()
    )


@router.get("/{slug}", response_model=ToolRead)
def get_admin_tool(slug: str, db: Session = Depends(get_session), admin: str = Depends(require_admin)):
    tool = (
        db.query(Tool)
        .options(selectinload(Tool.categories), selectinload(Tool.tags), selectinload(Tool.guides))
        .filter(Tool.slug == slug)
        .one_or_none()
    )
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool
