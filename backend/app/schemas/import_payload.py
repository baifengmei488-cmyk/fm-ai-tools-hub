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


class ContentPlanItemImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    page_path: str
    page_name: str
    section: str
    required_content: list[str] = Field(default_factory=list)
    tool_slugs: list[str] = Field(default_factory=list)
    status: str = "planned"


class ChangeDetailImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tool_slug: str = ""
    tool_name: str = ""
    page_path: str
    section: str
    field: str
    change_type: str
    before: str = ""
    after: str = ""
    source_titles: list[str] = Field(default_factory=list)


class ToolReferenceImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    slug: str = ""
    type: str = ""


class HomeHighlightImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    description: str
    tools: list[ToolReferenceImport] = Field(default_factory=list)


class WorkflowItemImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    flow: str
    prompt: str
    tools: list[ToolReferenceImport] = Field(default_factory=list)


class PromptGroupImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    description: str
    tools: list[ToolReferenceImport] = Field(default_factory=list)
    prompts: list[str] = Field(default_factory=list)


class CommandGroupImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    tools: list[ToolReferenceImport] = Field(default_factory=list)
    commands: list[str] = Field(default_factory=list)
    note: str = ""


class GuideChoiceImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    need: str
    tools: list[ToolReferenceImport] = Field(default_factory=list)


class GuideWorkflowTipImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scenario: str
    tools: list[ToolReferenceImport] = Field(default_factory=list)
    suggestion: str


class PageContentImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    home_highlights: list[HomeHighlightImport] = Field(default_factory=list)
    workflows: list[WorkflowItemImport] = Field(default_factory=list)
    tool_combinations: list[WorkflowItemImport] = Field(default_factory=list)
    prompt_groups: list[PromptGroupImport] = Field(default_factory=list)
    command_groups: list[CommandGroupImport] = Field(default_factory=list)
    guide_choices: list[GuideChoiceImport] = Field(default_factory=list)
    guide_workflow_tips: list[GuideWorkflowTipImport] = Field(default_factory=list)
    guide_safety_notes: list[str] = Field(default_factory=list)


class UpdateChangeImport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    change_type: str
    description: str
    tool_slugs: list[str] = Field(default_factory=list)
    page_paths: list[str] = Field(default_factory=list)
    added_tool_slugs: list[str] = Field(default_factory=list)
    updated_tool_slugs: list[str] = Field(default_factory=list)
    deleted_tool_slugs: list[str] = Field(default_factory=list)
    change_details: list[ChangeDetailImport] = Field(default_factory=list)


class ToolImportPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: str
    generated_at: str
    content_plan: list[ContentPlanItemImport] = Field(default_factory=list)
    sources: list[UpdateSourceImport] = Field(default_factory=list)
    changes: list[UpdateChangeImport] = Field(default_factory=list)
    page_content: PageContentImport | None = None
    tools: list[ToolImport]


class ImportPreviewResult(BaseModel):
    tool_count: int
    guide_count: int
    category_count: int
    tag_count: int
    sensitive_findings: list[dict[str, str]]
