from datetime import datetime

from pydantic import BaseModel


class UpdateLogSourceRead(BaseModel):
    title: str
    url: str = ""
    source_type: str
    checked_at: str
    note: str = ""


class UpdateLogChangeRead(BaseModel):
    title: str
    change_type: str
    description: str
    tool_slugs: list[str] = []
    page_paths: list[str] = []


class UpdateLogToolRead(BaseModel):
    name: str
    slug: str
    type: str
    status: str


class UpdateLogValidationRead(BaseModel):
    status: str
    message: str
    sensitive_findings_count: int


class UpdateLogEntryRead(BaseModel):
    id: int
    source: str
    status: str
    summary: str
    update_time: datetime
    generated_at: str
    sources: list[UpdateLogSourceRead]
    changes: list[UpdateLogChangeRead]
    affected_tools: list[UpdateLogToolRead]
    guide_count: int
    validation: UpdateLogValidationRead
