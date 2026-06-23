from pydantic import BaseModel, ConfigDict, Field


class GuideImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    guide_type: str = "usage"
    visibility: str = "public"
    content_markdown: str


class ToolImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

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


class UpdateSourceImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    url: str = ""
    source_type: str
    checked_at: str
    note: str = ""


class UpdateChangeImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    change_type: str
    description: str
    tool_slugs: list[str] = Field(default_factory=list)
    page_paths: list[str] = Field(default_factory=list)


class ToolImportPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: str
    generated_at: str
    sources: list[UpdateSourceImport] = Field(default_factory=list)
    changes: list[UpdateChangeImport] = Field(default_factory=list)
    tools: list[ToolImport]


class ImportPreviewResult(BaseModel):
    tool_count: int
    guide_count: int
    category_count: int
    tag_count: int
    sensitive_findings: list[dict[str, str]]
