from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.taxonomy import tool_categories, tool_tags


class Tool(Base):
    __tablename__ = "tools"
    __table_args__ = (UniqueConstraint("slug", name="uq_tools_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(60), nullable=False)
    status: Mapped[str] = mapped_column(String(60), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    homepage_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    install_command: Mapped[str] = mapped_column(Text, nullable=False, default="")
    verify_command: Mapped[str] = mapped_column(Text, nullable=False, default="")
    visibility: Mapped[str] = mapped_column(String(40), nullable=False, default="public")
    is_skill_candidate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_runbook_candidate: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    categories = relationship("Category", secondary=tool_categories, back_populates="tools")
    tags = relationship("Tag", secondary=tool_tags, back_populates="tools")
    guides = relationship("Guide", back_populates="tool", cascade="all, delete-orphan")
