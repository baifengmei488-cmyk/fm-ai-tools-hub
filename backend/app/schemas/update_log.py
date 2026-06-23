from pydantic import BaseModel, Field


class UpdateLogSourceRead(BaseModel):
    title: str
    url: str = ""
    source_type: str
    checked_at: str
    note: str = ""


class UpdateLogContentPlanItemRead(BaseModel):
    page_path: str
    page_name: str
    section: str
    required_content: list[str] = Field(default_factory=list)
    tool_slugs: list[str] = Field(default_factory=list)
    status: str = "planned"


class UpdateLogChangeDetailRead(BaseModel):
    tool_slug: str = ""
    tool_name: str = ""
    page_path: str
    section: str
    field: str
    change_type: str
    before: str = ""
    after: str = ""
    source_titles: list[str] = Field(default_factory=list)


class UpdateLogChangeRead(BaseModel):
    title: str
    change_type: str
    description: str
    tool_slugs: list[str] = Field(default_factory=list)
    page_paths: list[str] = Field(default_factory=list)
    added_tool_slugs: list[str] = Field(default_factory=list)
    updated_tool_slugs: list[str] = Field(default_factory=list)
    deleted_tool_slugs: list[str] = Field(default_factory=list)
    change_details: list[UpdateLogChangeDetailRead] = Field(default_factory=list)


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
    update_time: str
    generated_at: str
    content_plan: list[UpdateLogContentPlanItemRead]
    sources: list[UpdateLogSourceRead]
    changes: list[UpdateLogChangeRead]
    execution_report: list[str] = Field(default_factory=list)
    affected_tools: list[UpdateLogToolRead]
    guide_count: int
    validation: UpdateLogValidationRead
