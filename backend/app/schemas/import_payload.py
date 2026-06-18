from pydantic import BaseModel, Field


class GuideImport(BaseModel):
    title: str
    guide_type: str = "usage"
    visibility: str = "public"
    content_markdown: str


class ToolImport(BaseModel):
    name: str
    slug: str
    type: str
    status: str
    summary: str = ""
    homepage_url: str = ""
    install_command: str = ""
    verify_command: str = ""
    visibility: str = "public"
    is_skill_candidate: bool = False
    is_runbook_candidate: bool = False
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    guides: list[GuideImport] = Field(default_factory=list)


class ToolImportPayload(BaseModel):
    source: str
    generated_at: str
    tools: list[ToolImport]


class ImportPreviewResult(BaseModel):
    tool_count: int
    guide_count: int
    category_count: int
    tag_count: int
    sensitive_findings: list[dict[str, str]]
