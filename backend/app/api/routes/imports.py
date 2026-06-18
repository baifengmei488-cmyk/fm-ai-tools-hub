from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_session, require_admin
from app.schemas.import_payload import ImportPreviewResult, ToolImportPayload
from app.services.import_tools import import_tool_payload, preview_tool_payload

router = APIRouter(prefix="/api/admin/imports", tags=["imports"])


@router.post("/tools/preview", response_model=ImportPreviewResult)
def preview_tools(payload: ToolImportPayload, admin: str = Depends(require_admin)):
    return preview_tool_payload(payload)


@router.post("/tools")
def import_tools(
    payload: ToolImportPayload,
    db: Session = Depends(get_session),
    admin: str = Depends(require_admin),
):
    preview = preview_tool_payload(payload)
    if preview.sensitive_findings:
        raise HTTPException(status_code=400, detail={"sensitive_findings": preview.sensitive_findings})
    result = import_tool_payload(db, payload)
    return {"created": result.created, "updated": result.updated, "import_id": result.import_id}
