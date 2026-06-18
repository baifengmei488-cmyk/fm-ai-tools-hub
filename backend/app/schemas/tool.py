from pydantic import BaseModel


class GuideRead(BaseModel):
    id: int
    title: str
    guide_type: str
    visibility: str
    content_markdown: str

    model_config = {"from_attributes": True}


class TaxonomyRead(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ToolRead(BaseModel):
    id: int
    name: str
    slug: str
    type: str
    status: str
    summary: str
    homepage_url: str
    install_command: str
    verify_command: str
    visibility: str
    is_skill_candidate: bool
    is_runbook_candidate: bool
    categories: list[TaxonomyRead]
    tags: list[TaxonomyRead]
    guides: list[GuideRead]

    model_config = {"from_attributes": True}
