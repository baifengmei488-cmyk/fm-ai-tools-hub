# ToolVault MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first ToolVault website MVP: a FastAPI + React knowledge base for installed tools, guides, categories, visibility control, admin editing, and Claude-generated JSON imports.

**Architecture:** Use a small monorepo with `backend/` and `frontend/`. The backend owns persistence, auth, visibility filtering, import validation, and upsert logic. The frontend consumes the API for public browsing and admin management; Claude remains responsible for local scanning and generating reviewable import JSON.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL, pytest, React, Vite, Tailwind CSS, react-markdown, rehype-sanitize, Docker Compose.

---

## File Structure

Create this project structure under `/Users/baifengmei/Documents/code/toolvault`.

```text
toolvault/
  .env.example
  .gitignore
  docker-compose.yml
  docs/superpowers/specs/2026-06-18-toolvault-design.md
  docs/superpowers/plans/2026-06-18-toolvault-mvp.md
  imports/.gitkeep
  fixtures/sample-tool-import.json
  backend/
    pyproject.toml
    alembic.ini
    app/__init__.py
    app/main.py
    app/api/__init__.py
    app/api/deps.py
    app/api/routes/__init__.py
    app/api/routes/auth.py
    app/api/routes/public_tools.py
    app/api/routes/admin_tools.py
    app/api/routes/imports.py
    app/core/__init__.py
    app/core/config.py
    app/core/database.py
    app/core/security.py
    app/models/__init__.py
    app/models/base.py
    app/models/tool.py
    app/models/taxonomy.py
    app/models/guide.py
    app/models/import_batch.py
    app/models/user.py
    app/schemas/__init__.py
    app/schemas/auth.py
    app/schemas/tool.py
    app/schemas/import_payload.py
    app/services/__init__.py
    app/services/import_tools.py
    app/services/sensitive_scan.py
    app/cli/__init__.py
    app/cli/import_tools.py
    tests/conftest.py
    tests/test_models.py
    tests/test_sensitive_scan.py
    tests/test_import_service.py
    tests/test_auth_api.py
    tests/test_public_admin_api.py
  frontend/
    package.json
    index.html
    vite.config.ts
    tsconfig.json
    tsconfig.node.json
    tailwind.config.js
    postcss.config.js
    src/main.tsx
    src/App.tsx
    src/styles.css
    src/api/client.ts
    src/components/Layout.tsx
    src/pages/HomePage.tsx
    src/pages/ToolListPage.tsx
    src/pages/ToolDetailPage.tsx
    src/pages/LoginPage.tsx
    src/pages/admin/AdminToolsPage.tsx
    src/pages/admin/ImportPage.tsx
```

Boundary rules:

- `backend/app/models`: persistence only.
- `backend/app/schemas`: request and response shapes only.
- `backend/app/services`: import and scanning business logic only.
- `backend/app/api/routes`: HTTP wiring only.
- `frontend/src/api`: fetch wrappers only.
- `frontend/src/pages`: screen-level components only.

---

## Task 1: Initialize Repository and Project Configuration

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `imports/.gitkeep`
- Create: `fixtures/sample-tool-import.json`
- Create: `backend/pyproject.toml`
- Create: `frontend/package.json`

- [ ] **Step 1: Initialize git repository**

Run:

```bash
git init /Users/baifengmei/Documents/code/toolvault
```

Expected: command succeeds and creates `.git/`.

- [ ] **Step 2: Create root configuration files**

Create `.gitignore`:

```gitignore
.env
.venv/
__pycache__/
.pytest_cache/
.ruff_cache/
.mypy_cache/
.coverage
htmlcov/
node_modules/
dist/
build/
.DS_Store
*.log
imports/*.json
!imports/.gitkeep
```

Create `.env.example`:

```dotenv
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault
TOOLVAULT_SECRET_KEY=toolvault-local-development-secret
TOOLVAULT_ADMIN_USERNAME=admin
TOOLVAULT_ADMIN_PASSWORD=toolvault-admin-local
TOOLVAULT_CORS_ORIGINS=http://localhost:5173
```

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: toolvault-postgres
    environment:
      POSTGRES_DB: toolvault
      POSTGRES_USER: toolvault
      POSTGRES_PASSWORD: toolvault_local_password
    ports:
      - "5433:5432"
    volumes:
      - toolvault_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U toolvault -d toolvault"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  toolvault_postgres_data:
```

Create `imports/.gitkeep` as an empty file.

Create `fixtures/sample-tool-import.json`:

```json
{
  "source": "claude_local_scan",
  "generated_at": "2026-06-18T10:00:00+08:00",
  "tools": [
    {
      "name": "Playwright MCP",
      "slug": "playwright-mcp",
      "type": "mcp",
      "status": "configured",
      "summary": "用于浏览器自动化、页面测试、截图和 E2E 验收。",
      "homepage_url": "",
      "install_command": "claude mcp add -s user playwright -- npx -y @playwright/mcp",
      "verify_command": "claude mcp get playwright",
      "visibility": "public",
      "is_skill_candidate": false,
      "is_runbook_candidate": true,
      "categories": ["测试工具", "MCP"],
      "tags": ["playwright", "browser", "e2e"],
      "guides": [
        {
          "title": "使用指南",
          "guide_type": "usage",
          "visibility": "public",
          "content_markdown": "# Playwright MCP 使用指南\n\n用于打开网页、点击按钮、填写表单、截图和检查控制台错误。"
        }
      ]
    }
  ]
}
```

- [ ] **Step 3: Create backend package configuration**

Create `backend/pyproject.toml`:

```toml
[project]
name = "toolvault-backend"
version = "0.1.0"
description = "FastAPI backend for ToolVault"
requires-python = ">=3.12"
dependencies = [
  "alembic>=1.14.0",
  "fastapi>=0.115.0",
  "httpx>=0.27.0",
  "psycopg[binary]>=3.2.0",
  "pydantic-settings>=2.6.0",
  "python-jose[cryptography]>=3.3.0",
  "python-multipart>=0.0.12",
  "sqlalchemy>=2.0.36",
  "uvicorn[standard]>=0.32.0"
]

[dependency-groups]
dev = [
  "pytest>=8.3.0",
  "pytest-cov>=5.0.0",
  "ruff>=0.8.0"
]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]

[tool.ruff]
line-length = 100
```

Create `frontend/package.json`:

```json
{
  "name": "toolvault-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "react-router-dom": "latest",
    "react-markdown": "latest",
    "rehype-sanitize": "latest"
  },
  "devDependencies": {
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "latest",
    "tailwindcss": "latest",
    "postcss": "latest",
    "autoprefixer": "latest"
  }
}
```

- [ ] **Step 4: Verify configuration files exist**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault status --short
```

Expected: shows the created files as untracked.

- [ ] **Step 5: Commit repository bootstrap**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add .gitignore .env.example docker-compose.yml imports/.gitkeep fixtures/sample-tool-import.json backend/pyproject.toml frontend/package.json docs/superpowers/specs/2026-06-18-toolvault-design.md docs/superpowers/plans/2026-06-18-toolvault-mvp.md
git -C /Users/baifengmei/Documents/code/toolvault commit -m "chore: initialize ToolVault project"
```

Expected: commit succeeds.

---

## Task 2: Backend Database Models and Test Database Setup

**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/models/base.py`
- Create: `backend/app/models/tool.py`
- Create: `backend/app/models/taxonomy.py`
- Create: `backend/app/models/guide.py`
- Create: `backend/app/models/import_batch.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_models.py`

- [ ] **Step 1: Write failing model test**

Create `backend/tests/test_models.py`:

```python
from app.models import Category, Guide, Tag, Tool


def test_tool_can_store_categories_tags_and_guides(db_session):
    tool = Tool(
        name="Playwright MCP",
        slug="playwright-mcp",
        type="mcp",
        status="configured",
        summary="Browser automation for testing",
        visibility="public",
    )
    tool.categories.append(Category(name="测试工具", slug="testing-tools"))
    tool.tags.append(Tag(name="playwright", slug="playwright"))
    tool.guides.append(
        Guide(
            title="使用指南",
            guide_type="usage",
            visibility="public",
            content_markdown="# Playwright MCP",
        )
    )

    db_session.add(tool)
    db_session.commit()

    saved = db_session.query(Tool).filter_by(slug="playwright-mcp").one()
    assert saved.name == "Playwright MCP"
    assert saved.categories[0].slug == "testing-tools"
    assert saved.tags[0].slug == "playwright"
    assert saved.guides[0].content_markdown == "# Playwright MCP"
```

- [ ] **Step 2: Add test database fixture**

Create `backend/tests/conftest.py`:

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.models import Base


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)
    with TestingSession() as session:
        yield session
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_models.py -v
```

Expected: FAIL with import errors for missing `app.models`.

- [ ] **Step 4: Implement models**

Create `backend/app/models/base.py`:

```python
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
```

Create `backend/app/models/taxonomy.py`:

```python
from sqlalchemy import Column, ForeignKey, Integer, String, Table, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


tool_categories = Table(
    "tool_categories",
    Base.metadata,
    Column("tool_id", ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

tool_tags = Table(
    "tool_tags",
    Base.metadata,
    Column("tool_id", ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("slug", name="uq_categories_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), nullable=False, index=True)

    tools = relationship("Tool", secondary=tool_categories, back_populates="categories")


class Tag(Base):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("slug", name="uq_tags_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), nullable=False, index=True)

    tools = relationship("Tool", secondary=tool_tags, back_populates="tags")
```

Create `backend/app/models/tool.py`:

```python
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
```

Create `backend/app/models/guide.py`:

```python
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Guide(Base):
    __tablename__ = "tool_guides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tool_id: Mapped[int] = mapped_column(ForeignKey("tools.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    guide_type: Mapped[str] = mapped_column(String(60), nullable=False)
    visibility: Mapped[str] = mapped_column(String(40), nullable=False, default="public")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    tool = relationship("Tool", back_populates="guides")
```

Create `backend/app/models/import_batch.py`:

```python
from datetime import datetime
from sqlalchemy import DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ImportBatch(Base):
    __tablename__ = "imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    raw_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
```

Create `backend/app/models/user.py`:

```python
from datetime import datetime
from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("username", name="uq_users_username"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(300), nullable=False)
    role: Mapped[str] = mapped_column(String(60), nullable=False, default="admin")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
```

Create `backend/app/models/__init__.py`:

```python
from app.models.base import Base
from app.models.guide import Guide
from app.models.import_batch import ImportBatch
from app.models.taxonomy import Category, Tag
from app.models.tool import Tool
from app.models.user import User

__all__ = ["Base", "Category", "Guide", "ImportBatch", "Tag", "Tool", "User"]
```

Create empty package files:

```bash
touch backend/app/__init__.py backend/app/core/__init__.py backend/app/api/__init__.py backend/app/api/routes/__init__.py backend/app/services/__init__.py backend/app/schemas/__init__.py backend/app/cli/__init__.py
```

Create `backend/app/core/config.py`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite+pysqlite:///./toolvault.db"
    secret_key: str = "toolvault-local-development-secret"
    admin_username: str = "admin"
    admin_password: str = "toolvault-admin-local"
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_prefix="TOOLVAULT_", env_file=".env")


settings = Settings()
```

Create `backend/app/core/database.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, class_=Session, expire_on_commit=False)


def get_db():
    with SessionLocal() as session:
        yield session
```

- [ ] **Step 5: Run model test to verify it passes**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_models.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit backend models**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add backend/app backend/tests
git -C /Users/baifengmei/Documents/code/toolvault commit -m "feat: add backend data models"
```

Expected: commit succeeds.

---

## Task 3: Sensitive Content Scanner and Import Payload Schemas

**Files:**
- Create: `backend/app/services/sensitive_scan.py`
- Create: `backend/app/schemas/import_payload.py`
- Create: `backend/tests/test_sensitive_scan.py`

- [ ] **Step 1: Write failing sensitive scan tests**

Create `backend/tests/test_sensitive_scan.py`:

```python
from app.services.sensitive_scan import find_sensitive_findings


def test_sensitive_scan_flags_real_password_assignment():
    payload = {
        "tools": [
            {
                "name": "Database",
                "install_command": "mysql -u root -pSuperSecret123",
            }
        ]
    }

    findings = find_sensitive_findings(payload)

    assert findings
    assert findings[0].path == "tools[0].install_command"


def test_sensitive_scan_allows_documentation_placeholders():
    payload = {
        "tools": [
            {
                "name": "GitHub MCP",
                "install_command": "claude mcp add github -e GITHUB_PERSONAL_ACCESS_TOKEN=YOUR_TOKEN",
                "summary": "Use readonly_user and your_password placeholders in docs.",
            }
        ]
    }

    assert find_sensitive_findings(payload) == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_sensitive_scan.py -v
```

Expected: FAIL with missing `app.services.sensitive_scan`.

- [ ] **Step 3: Implement sensitive scanner**

Create `backend/app/services/sensitive_scan.py`:

```python
from dataclasses import dataclass
import re
from typing import Any

SENSITIVE_KEY_RE = re.compile(r"(token|password|passwd|secret|cookie|private_key|accesskey|access_key)", re.I)
SECRET_ASSIGNMENT_RE = re.compile(
    r"(?i)(token|password|passwd|secret|cookie|access[_-]?key|mysql_pass)\s*[=:]\s*['\"]?([^\s'\"]+)"
)
MYSQL_INLINE_PASSWORD_RE = re.compile(r"-p(?!\s)([^\s]+)")
PLACEHOLDER_VALUES = {
    "YOUR_TOKEN",
    "YOUR_PASSWORD",
    "your_password",
    "readonly_user",
    "toolvault-admin-local",
    "toolvault-local-development-secret",
}


@dataclass(frozen=True)
class SensitiveFinding:
    path: str
    reason: str


def _is_placeholder(value: str) -> bool:
    if value in PLACEHOLDER_VALUES:
        return True
    lowered = value.lower()
    return lowered.startswith("your_") or lowered.startswith("example_") or lowered.startswith("change_me")


def _scan_string(path: str, value: str) -> list[SensitiveFinding]:
    findings: list[SensitiveFinding] = []
    for match in SECRET_ASSIGNMENT_RE.finditer(value):
        assigned = match.group(2).strip()
        if not _is_placeholder(assigned):
            findings.append(SensitiveFinding(path=path, reason=f"secret assignment for {match.group(1)}"))
    mysql_match = MYSQL_INLINE_PASSWORD_RE.search(value)
    if mysql_match and not _is_placeholder(mysql_match.group(1)):
        findings.append(SensitiveFinding(path=path, reason="inline mysql password"))
    return findings


def find_sensitive_findings(payload: Any, path: str = "") -> list[SensitiveFinding]:
    findings: list[SensitiveFinding] = []
    if isinstance(payload, dict):
        for key, value in payload.items():
            child_path = f"{path}.{key}" if path else str(key)
            if SENSITIVE_KEY_RE.search(str(key)) and isinstance(value, str) and not _is_placeholder(value):
                findings.append(SensitiveFinding(path=child_path, reason=f"sensitive key {key}"))
            findings.extend(find_sensitive_findings(value, child_path))
    elif isinstance(payload, list):
        for index, item in enumerate(payload):
            findings.extend(find_sensitive_findings(item, f"{path}[{index}]"))
    elif isinstance(payload, str):
        findings.extend(_scan_string(path, payload))
    return findings
```

Create `backend/app/schemas/import_payload.py`:

```python
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
```

- [ ] **Step 4: Run sensitive scan tests**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_sensitive_scan.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit scanner and schemas**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add backend/app/services/sensitive_scan.py backend/app/schemas/import_payload.py backend/tests/test_sensitive_scan.py
git -C /Users/baifengmei/Documents/code/toolvault commit -m "feat: add import safety scanner"
```

Expected: commit succeeds.

---

## Task 4: JSON Import Upsert Service and Import History

**Files:**
- Create: `backend/app/services/import_tools.py`
- Create: `backend/tests/test_import_service.py`

- [ ] **Step 1: Write failing import service tests**

Create `backend/tests/test_import_service.py`:

```python
from app.models import ImportBatch, Tool
from app.schemas.import_payload import ToolImportPayload
from app.services.import_tools import import_tool_payload, preview_tool_payload


def _payload(summary="Browser automation"):
    return ToolImportPayload.model_validate(
        {
            "source": "claude_local_scan",
            "generated_at": "2026-06-18T10:00:00+08:00",
            "tools": [
                {
                    "name": "Playwright MCP",
                    "slug": "playwright-mcp",
                    "type": "mcp",
                    "status": "configured",
                    "summary": summary,
                    "visibility": "public",
                    "categories": ["测试工具", "MCP"],
                    "tags": ["playwright", "browser"],
                    "guides": [
                        {
                            "title": "使用指南",
                            "guide_type": "usage",
                            "visibility": "public",
                            "content_markdown": "# Guide",
                        }
                    ],
                }
            ],
        }
    )


def test_preview_counts_payload_items():
    preview = preview_tool_payload(_payload())

    assert preview.tool_count == 1
    assert preview.guide_count == 1
    assert preview.category_count == 2
    assert preview.tag_count == 2
    assert preview.sensitive_findings == []


def test_import_creates_tool_and_history(db_session):
    result = import_tool_payload(db_session, _payload())

    assert result.created == 1
    assert result.updated == 0
    saved = db_session.query(Tool).filter_by(slug="playwright-mcp").one()
    assert saved.categories[0].name in {"测试工具", "MCP"}
    assert saved.guides[0].title == "使用指南"
    assert db_session.query(ImportBatch).count() == 1


def test_import_updates_existing_tool_by_slug(db_session):
    import_tool_payload(db_session, _payload())
    result = import_tool_payload(db_session, _payload(summary="Updated summary"))

    assert result.created == 0
    assert result.updated == 1
    saved = db_session.query(Tool).filter_by(slug="playwright-mcp").one()
    assert saved.summary == "Updated summary"
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_import_service.py -v
```

Expected: FAIL with missing `app.services.import_tools`.

- [ ] **Step 3: Implement import service**

Create `backend/app/services/import_tools.py`:

```python
from dataclasses import dataclass
import re
from sqlalchemy.orm import Session

from app.models import Category, Guide, ImportBatch, Tag, Tool
from app.schemas.import_payload import ImportPreviewResult, ToolImportPayload
from app.services.sensitive_scan import find_sensitive_findings


@dataclass(frozen=True)
class ImportResult:
    created: int
    updated: int
    import_id: int


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9一-鿿]+", "-", value.strip().lower()).strip("-")
    return slug or "item"


def preview_tool_payload(payload: ToolImportPayload) -> ImportPreviewResult:
    categories = {category for tool in payload.tools for category in tool.categories}
    tags = {tag for tool in payload.tools for tag in tool.tags}
    guides = sum(len(tool.guides) for tool in payload.tools)
    findings = [finding.__dict__ for finding in find_sensitive_findings(payload.model_dump())]
    return ImportPreviewResult(
        tool_count=len(payload.tools),
        guide_count=guides,
        category_count=len(categories),
        tag_count=len(tags),
        sensitive_findings=findings,
    )


def _get_or_create_category(db: Session, name: str) -> Category:
    slug = slugify(name)
    category = db.query(Category).filter_by(slug=slug).one_or_none()
    if category is None:
        category = Category(name=name, slug=slug)
        db.add(category)
        db.flush()
    return category


def _get_or_create_tag(db: Session, name: str) -> Tag:
    slug = slugify(name)
    tag = db.query(Tag).filter_by(slug=slug).one_or_none()
    if tag is None:
        tag = Tag(name=name, slug=slug)
        db.add(tag)
        db.flush()
    return tag


def import_tool_payload(db: Session, payload: ToolImportPayload) -> ImportResult:
    preview = preview_tool_payload(payload)
    if preview.sensitive_findings:
        batch = ImportBatch(
            source=payload.source,
            status="failed",
            summary="Sensitive content detected",
            raw_payload=payload.model_dump(),
        )
        db.add(batch)
        db.commit()
        return ImportResult(created=0, updated=0, import_id=batch.id)

    created = 0
    updated = 0
    for item in payload.tools:
        tool = db.query(Tool).filter_by(slug=item.slug).one_or_none()
        if tool is None:
            tool = Tool(name=item.name, slug=item.slug, type=item.type, status=item.status)
            created += 1
            db.add(tool)
        else:
            updated += 1

        tool.name = item.name
        tool.type = item.type
        tool.status = item.status
        tool.summary = item.summary
        tool.homepage_url = item.homepage_url
        tool.install_command = item.install_command
        tool.verify_command = item.verify_command
        tool.visibility = item.visibility
        tool.is_skill_candidate = item.is_skill_candidate
        tool.is_runbook_candidate = item.is_runbook_candidate
        tool.categories = [_get_or_create_category(db, name) for name in item.categories]
        tool.tags = [_get_or_create_tag(db, name) for name in item.tags]
        tool.guides.clear()
        for guide in item.guides:
            tool.guides.append(
                Guide(
                    title=guide.title,
                    guide_type=guide.guide_type,
                    visibility=guide.visibility,
                    content_markdown=guide.content_markdown,
                )
            )

    batch = ImportBatch(
        source=payload.source,
        status="imported",
        summary=f"created={created}, updated={updated}",
        raw_payload=payload.model_dump(),
    )
    db.add(batch)
    db.commit()
    return ImportResult(created=created, updated=updated, import_id=batch.id)
```

- [ ] **Step 4: Run import service tests**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_import_service.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit import service**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add backend/app/services/import_tools.py backend/tests/test_import_service.py
git -C /Users/baifengmei/Documents/code/toolvault commit -m "feat: add tool import service"
```

Expected: commit succeeds.

---

## Task 5: Authentication and Admin Dependency

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/api/deps.py`
- Create: `backend/app/api/routes/auth.py`
- Create: `backend/tests/test_auth_api.py`

- [ ] **Step 1: Write failing auth API tests**

Create `backend/tests/test_auth_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_login_returns_access_token():
    client = TestClient(app)

    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "toolvault-admin-local"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_rejects_wrong_password():
    client = TestClient(app)

    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrong-password"},
    )

    assert response.status_code == 401
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_auth_api.py -v
```

Expected: FAIL with missing `app.main` or auth route.

- [ ] **Step 3: Implement auth support**

Create `backend/app/core/security.py`:

```python
from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 8


def hash_password(password: str, salt: str | None = None) -> str:
    actual_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), actual_salt.encode(), 200_000)
    return f"pbkdf2_sha256${actual_salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    algorithm, salt, expected = password_hash.split("$", 2)
    if algorithm != "pbkdf2_sha256":
        return False
    actual = hash_password(password, salt).split("$", 2)[2]
    return secrets.compare_digest(actual, expected)


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
    subject = payload.get("sub")
    return subject if isinstance(subject, str) else None
```

Create `backend/app/schemas/auth.py`:

```python
from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

Create `backend/app/api/routes/auth.py`:

```python
from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    if payload.username != settings.admin_username or payload.password != settings.admin_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(payload.username))
```

Create `backend/app/api/deps.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_session(db: Session = Depends(get_db)) -> Session:
    return db


def require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> str:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    subject = decode_access_token(credentials.credentials)
    if subject is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token")
    return subject
```

Create `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.core.config import settings

app = FastAPI(title="ToolVault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 4: Run auth tests**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_auth_api.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit auth API**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add backend/app/core/security.py backend/app/schemas/auth.py backend/app/api/deps.py backend/app/api/routes/auth.py backend/app/main.py backend/tests/test_auth_api.py
git -C /Users/baifengmei/Documents/code/toolvault commit -m "feat: add admin authentication"
```

Expected: commit succeeds.

---

## Task 6: Public, Admin, and Import HTTP APIs

**Files:**
- Create: `backend/app/schemas/tool.py`
- Create: `backend/app/api/routes/public_tools.py`
- Create: `backend/app/api/routes/admin_tools.py`
- Create: `backend/app/api/routes/imports.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_public_admin_api.py`

- [ ] **Step 1: Write failing API tests**

Create `backend/tests/test_public_admin_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def _token(client: TestClient) -> str:
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "toolvault-admin-local"},
    )
    return response.json()["access_token"]


def test_admin_can_import_and_public_can_read_public_tool():
    client = TestClient(app)
    token = _token(client)
    payload = {
        "source": "claude_local_scan",
        "generated_at": "2026-06-18T10:00:00+08:00",
        "tools": [
            {
                "name": "OpenSpec",
                "slug": "openspec",
                "type": "cli_tool",
                "status": "installed",
                "summary": "规格驱动开发工具",
                "visibility": "public",
                "categories": ["开发工具"],
                "tags": ["spec"],
                "guides": [
                    {
                        "title": "使用指南",
                        "guide_type": "usage",
                        "visibility": "public",
                        "content_markdown": "# OpenSpec",
                    }
                ],
            }
        ],
    }

    import_response = client.post(
        "/api/admin/imports/tools",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert import_response.status_code == 200
    list_response = client.get("/api/tools")
    assert list_response.status_code == 200
    assert list_response.json()[0]["slug"] == "openspec"
    detail_response = client.get("/api/tools/openspec")
    assert detail_response.status_code == 200
    assert detail_response.json()["guides"][0]["title"] == "使用指南"


def test_private_tool_is_hidden_from_public_list():
    client = TestClient(app)
    token = _token(client)
    payload = {
        "source": "claude_local_scan",
        "generated_at": "2026-06-18T10:00:00+08:00",
        "tools": [
            {
                "name": "Private Runbook",
                "slug": "private-runbook",
                "type": "skill",
                "status": "draft",
                "summary": "Internal workflow",
                "visibility": "login_required",
                "categories": [],
                "tags": [],
                "guides": [],
            }
        ],
    }

    client.post(
        "/api/admin/imports/tools",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert client.get("/api/tools/private-runbook").status_code == 404
    admin_response = client.get(
        "/api/admin/tools/private-runbook",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert admin_response.status_code == 200
```

- [ ] **Step 2: Ensure API tests use an isolated database**

Modify `backend/tests/conftest.py` to include app dependency override:

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.deps import get_session
from app.main import app
from app.models import Base


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, expire_on_commit=False, class_=Session)
    with TestingSession() as session:
        yield session


@pytest.fixture(autouse=True)
def override_db_dependency(db_session):
    def _override():
        yield db_session

    app.dependency_overrides[get_session] = _override
    yield
    app.dependency_overrides.clear()
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_public_admin_api.py -v
```

Expected: FAIL with missing routes.

- [ ] **Step 4: Implement tool schemas and routes**

Create `backend/app/schemas/tool.py`:

```python
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
```

Create `backend/app/api/routes/public_tools.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_session
from app.models import Guide, Tool
from app.schemas.tool import ToolRead

router = APIRouter(prefix="/api/tools", tags=["public-tools"])


def _public_query(db: Session):
    return (
        db.query(Tool)
        .options(selectinload(Tool.categories), selectinload(Tool.tags), selectinload(Tool.guides))
        .filter(Tool.visibility == "public")
        .order_by(Tool.name.asc())
    )


@router.get("", response_model=list[ToolRead])
def list_public_tools(q: str = "", type: str = "", db: Session = Depends(get_session)):
    query = _public_query(db)
    if q:
        query = query.filter(Tool.name.contains(q))
    if type:
        query = query.filter(Tool.type == type)
    tools = query.all()
    for tool in tools:
        tool.guides = [guide for guide in tool.guides if guide.visibility == "public"]
    return tools


@router.get("/{slug}", response_model=ToolRead)
def get_public_tool(slug: str, db: Session = Depends(get_session)):
    tool = _public_query(db).filter(Tool.slug == slug).one_or_none()
    if tool is None:
        raise HTTPException(status_code=404, detail="Tool not found")
    tool.guides = [guide for guide in tool.guides if guide.visibility == "public"]
    return tool
```

Create `backend/app/api/routes/admin_tools.py`:

```python
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
```

Create `backend/app/api/routes/imports.py`:

```python
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
```

Modify `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.admin_tools import router as admin_tools_router
from app.api.routes.auth import router as auth_router
from app.api.routes.imports import router as imports_router
from app.api.routes.public_tools import router as public_tools_router
from app.core.config import settings

app = FastAPI(title="ToolVault API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(public_tools_router)
app.include_router(admin_tools_router)
app.include_router(imports_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 5: Run API tests**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest tests/test_public_admin_api.py -v
```

Expected: PASS.

- [ ] **Step 6: Run all backend tests**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest -v
```

Expected: all tests PASS.

- [ ] **Step 7: Commit APIs**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add backend/app backend/tests
git -C /Users/baifengmei/Documents/code/toolvault commit -m "feat: add ToolVault APIs"
```

Expected: commit succeeds.

---

## Task 7: CLI Import Command and Alembic Migration

**Files:**
- Create: `backend/app/cli/import_tools.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/20260618_0001_create_core_tables.py`

- [ ] **Step 1: Create CLI import command**

Create `backend/app/cli/import_tools.py`:

```python
import json
import sys
from pathlib import Path

from app.core.database import SessionLocal
from app.schemas.import_payload import ToolImportPayload
from app.services.import_tools import import_tool_payload, preview_tool_payload


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python -m app.cli.import_tools <path-to-json>")
        return 2
    payload_path = Path(sys.argv[1])
    payload = ToolImportPayload.model_validate(json.loads(payload_path.read_text(encoding="utf-8")))
    preview = preview_tool_payload(payload)
    if preview.sensitive_findings:
        print(json.dumps(preview.model_dump(), ensure_ascii=False, indent=2))
        return 1
    with SessionLocal() as session:
        result = import_tool_payload(session, payload)
    print(json.dumps(result.__dict__, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Create Alembic configuration**

Create `backend/alembic.ini`:

```ini
[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = sqlite+pysqlite:///./toolvault.db

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
```

Create `backend/alembic/env.py`:

```python
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.models import Base

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

Create `backend/alembic/versions/20260618_0001_create_core_tables.py`:

```python
from alembic import op
import sqlalchemy as sa

revision = "20260618_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tools",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("type", sa.String(length=60), nullable=False),
        sa.Column("status", sa.String(length=60), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("homepage_url", sa.String(length=500), nullable=False),
        sa.Column("install_command", sa.Text(), nullable=False),
        sa.Column("verify_command", sa.Text(), nullable=False),
        sa.Column("visibility", sa.String(length=40), nullable=False),
        sa.Column("is_skill_candidate", sa.Boolean(), nullable=False),
        sa.Column("is_runbook_candidate", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_tools_slug"),
    )
    op.create_index("ix_tools_slug", "tools", ["slug"])
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.UniqueConstraint("slug", name="uq_categories_slug"),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"])
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("slug", sa.String(length=140), nullable=False),
        sa.UniqueConstraint("slug", name="uq_tags_slug"),
    )
    op.create_index("ix_tags_slug", "tags", ["slug"])
    op.create_table(
        "tool_categories",
        sa.Column("tool_id", sa.Integer(), sa.ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "tool_tags",
        sa.Column("tool_id", sa.Integer(), sa.ForeignKey("tools.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("tag_id", sa.Integer(), sa.ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "tool_guides",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tool_id", sa.Integer(), sa.ForeignKey("tools.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content_markdown", sa.Text(), nullable=False),
        sa.Column("guide_type", sa.String(length=60), nullable=False),
        sa.Column("visibility", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "imports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=300), nullable=False),
        sa.Column("role", sa.String(length=60), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("username", name="uq_users_username"),
    )
    op.create_index("ix_users_username", "users", ["username"])


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
    op.drop_table("imports")
    op.drop_table("tool_guides")
    op.drop_table("tool_tags")
    op.drop_table("tool_categories")
    op.drop_index("ix_tags_slug", table_name="tags")
    op.drop_table("tags")
    op.drop_index("ix_categories_slug", table_name="categories")
    op.drop_table("categories")
    op.drop_index("ix_tools_slug", table_name="tools")
    op.drop_table("tools")
```

- [ ] **Step 3: Verify migrations against local PostgreSQL**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault && docker compose up -d postgres
cd /Users/baifengmei/Documents/code/toolvault/backend && TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault uv run alembic upgrade head
```

Expected: Alembic applies revision `20260618_0001` successfully.

- [ ] **Step 4: Verify CLI import against local PostgreSQL**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault uv run python -m app.cli.import_tools ../fixtures/sample-tool-import.json
```

Expected: prints JSON with `"created": 1` and `"updated": 0`.

- [ ] **Step 5: Commit CLI and migration**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add backend/app/cli backend/alembic.ini backend/alembic
git -C /Users/baifengmei/Documents/code/toolvault commit -m "feat: add database migration and import CLI"
```

Expected: commit succeeds.

---

## Task 8: Frontend Public Site

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles.css`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/pages/HomePage.tsx`
- Create: `frontend/src/pages/ToolListPage.tsx`
- Create: `frontend/src/pages/ToolDetailPage.tsx`

- [ ] **Step 1: Create frontend foundation files**

Create `frontend/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ToolVault</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `frontend/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
```

Create `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `frontend/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `frontend/tailwind.config.js`:

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Create `frontend/postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `frontend/src/styles.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  background: #f8fafc;
  color: #0f172a;
}
```

- [ ] **Step 2: Create API client and public pages**

Create `frontend/src/api/client.ts`:

```ts
export type Guide = {
  id: number;
  title: string;
  guide_type: string;
  visibility: string;
  content_markdown: string;
};

export type Taxonomy = {
  id: number;
  name: string;
  slug: string;
};

export type Tool = {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  summary: string;
  homepage_url: string;
  install_command: string;
  verify_command: string;
  visibility: string;
  is_skill_candidate: boolean;
  is_runbook_candidate: boolean;
  categories: Taxonomy[];
  tags: Taxonomy[];
  guides: Guide[];
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
```

Create `frontend/src/components/Layout.tsx`:

```tsx
import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-bold text-slate-900">ToolVault</Link>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link to="/tools">工具库</Link>
            <Link to="/login">后台登录</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

Create `frontend/src/pages/HomePage.tsx`:

```tsx
import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">开发 / 测试工具知识库</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-950">ToolVault</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        记录 Claude Code MCP、插件、skills、CLI 工具、桌面应用和数据库工具，并沉淀使用指南、测试流程和未来 runbook 候选。
      </p>
      <Link className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 font-medium text-white" to="/tools">
        浏览工具库
      </Link>
    </section>
  );
}
```

Create `frontend/src/pages/ToolListPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet } from '../api/client';

export function ToolListPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const path = query ? `/api/tools?q=${encodeURIComponent(query)}` : '/api/tools';
    apiGet<Tool[]>(path).then(setTools).catch(() => setTools([]));
  }, [query]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">工具库</h1>
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="搜索工具"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.slug} to={`/tools/${tool.slug}`} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-950">{tool.name}</h2>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{tool.type}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{tool.summary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <span key={tag.slug} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{tag.name}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

Create `frontend/src/pages/ToolDetailPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Tool, apiGet } from '../api/client';

export function ToolDetailPage() {
  const { slug } = useParams();
  const [tool, setTool] = useState<Tool | null>(null);

  useEffect(() => {
    if (slug) {
      apiGet<Tool>(`/api/tools/${slug}`).then(setTool).catch(() => setTool(null));
    }
  }, [slug]);

  if (!tool) {
    return <p className="text-slate-600">未找到公开工具。</p>;
  }

  return (
    <article className="rounded-2xl bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{tool.name}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{tool.status}</span>
      </div>
      <p className="mt-4 text-slate-600">{tool.summary}</p>
      {tool.install_command && <pre className="mt-4 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-white">{tool.install_command}</pre>}
      {tool.guides.map((guide) => (
        <section key={guide.id} className="prose mt-8 max-w-none">
          <h2>{guide.title}</h2>
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{guide.content_markdown}</ReactMarkdown>
        </section>
      ))}
    </article>
  );
}
```

Create `frontend/src/App.tsx`:

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ToolListPage } from './pages/ToolListPage';
import { ToolDetailPage } from './pages/ToolDetailPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tools', element: <ToolListPage /> },
      { path: 'tools/:slug', element: <ToolDetailPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

Create `frontend/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Build frontend**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/frontend && npm install && npm run build
```

Expected: TypeScript and Vite build succeed.

- [ ] **Step 4: Commit public frontend**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add frontend
git -C /Users/baifengmei/Documents/code/toolvault commit -m "feat: add public ToolVault frontend"
```

Expected: commit succeeds.

---

## Task 9: Frontend Admin Login and Import Pages

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/api/client.ts`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/admin/AdminToolsPage.tsx`
- Create: `frontend/src/pages/admin/ImportPage.tsx`

- [ ] **Step 1: Extend API client for auth and admin calls**

Modify `frontend/src/api/client.ts` by adding these exports to the existing file:

```ts
export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export function getStoredToken(): string {
  return localStorage.getItem('toolvault_token') ?? '';
}

export function storeToken(token: string) {
  localStorage.setItem('toolvault_token', token);
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/auth/login', { username, password });
}
```

- [ ] **Step 2: Create login and admin pages**

Create `frontend/src/pages/LoginPage.tsx`:

```tsx
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, storeToken } from '../api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const response = await login(username, password);
      storeToken(response.access_token);
      navigate('/admin/tools');
    } catch {
      setError('用户名或密码错误');
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">后台登录</h1>
      <label className="mt-6 block text-sm font-medium">用户名</label>
      <input className="mt-2 w-full rounded-lg border px-3 py-2" value={username} onChange={(event) => setUsername(event.target.value)} />
      <label className="mt-4 block text-sm font-medium">密码</label>
      <input className="mt-2 w-full rounded-lg border px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white" type="submit">登录</button>
    </form>
  );
}
```

Create `frontend/src/pages/admin/AdminToolsPage.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet } from '../../api/client';

export function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    apiGet<Tool[]>('/api/tools').then(setTools).catch(() => setTools([]));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">后台工具管理</h1>
        <Link className="rounded-lg bg-blue-600 px-4 py-2 text-white" to="/admin/imports">导入 JSON</Link>
      </div>
      <div className="rounded-2xl bg-white shadow-sm">
        {tools.map((tool) => (
          <div key={tool.slug} className="flex items-center justify-between border-b px-5 py-4 last:border-b-0">
            <div>
              <p className="font-medium">{tool.name}</p>
              <p className="text-sm text-slate-500">{tool.type} · {tool.visibility}</p>
            </div>
            <span className="text-sm text-slate-500">{tool.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

Create `frontend/src/pages/admin/ImportPage.tsx`:

```tsx
import { FormEvent, useState } from 'react';
import { apiPost, getStoredToken } from '../../api/client';

export function ImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      const payload = JSON.parse(jsonText);
      const result = await apiPost<{ created: number; updated: number; import_id: number }>(
        '/api/admin/imports/tools',
        payload,
        getStoredToken(),
      );
      setMessage(`导入成功：新增 ${result.created}，更新 ${result.updated}`);
    } catch {
      setMessage('导入失败，请检查 JSON、登录状态或敏感信息提示。');
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Claude JSON 导入</h1>
      <p className="mt-2 text-sm text-slate-600">粘贴 Claude 生成并审阅过的导入 JSON。</p>
      <textarea
        className="mt-4 min-h-96 w-full rounded-lg border p-3 font-mono text-sm"
        value={jsonText}
        onChange={(event) => setJsonText(event.target.value)}
      />
      {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
      <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white" type="submit">执行导入</button>
    </form>
  );
}
```

Modify `frontend/src/App.tsx`:

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ToolListPage } from './pages/ToolListPage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { LoginPage } from './pages/LoginPage';
import { AdminToolsPage } from './pages/admin/AdminToolsPage';
import { ImportPage } from './pages/admin/ImportPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'tools', element: <ToolListPage /> },
      { path: 'tools/:slug', element: <ToolDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'admin/tools', element: <AdminToolsPage /> },
      { path: 'admin/imports', element: <ImportPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: Build frontend with admin pages**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/frontend && npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit admin frontend**

Run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault add frontend/src
git -C /Users/baifengmei/Documents/code/toolvault commit -m "feat: add admin import frontend"
```

Expected: commit succeeds.

---

## Task 10: End-to-End Verification

**Files:**
- Modify only if verification reveals a specific defect.

- [ ] **Step 1: Run full backend test suite**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && uv run pytest -v
```

Expected: all tests PASS.

- [ ] **Step 2: Run frontend production build**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/frontend && npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Start PostgreSQL and migrate database**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault && docker compose up -d postgres
cd /Users/baifengmei/Documents/code/toolvault/backend && TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault uv run alembic upgrade head
```

Expected: migration succeeds.

- [ ] **Step 4: Start backend server**

Run in one terminal:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault uv run uvicorn app.main:app --reload --port 8000
```

Expected: backend listens on `http://127.0.0.1:8000`.

- [ ] **Step 5: Import sample data**

Run in another terminal:

```bash
cd /Users/baifengmei/Documents/code/toolvault/backend && TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault uv run python -m app.cli.import_tools ../fixtures/sample-tool-import.json
```

Expected: output contains `"created": 1` on the first import or `"updated": 1` on repeated imports.

- [ ] **Step 6: Start frontend dev server**

Run:

```bash
cd /Users/baifengmei/Documents/code/toolvault/frontend && npm run dev -- --host 127.0.0.1
```

Expected: frontend listens on `http://127.0.0.1:5173`.

- [ ] **Step 7: Verify browser flow with Playwright MCP**

Use browser automation to check:

```text
1. Open http://127.0.0.1:5173.
2. Click 工具库.
3. Confirm Playwright MCP appears.
4. Open Playwright MCP detail page.
5. Confirm Markdown guide content renders.
6. Open /login.
7. Log in with username admin and password toolvault-admin-local.
8. Open /admin/imports.
9. Paste fixtures/sample-tool-import.json content.
10. Execute import and confirm success message.
```

Expected: public browsing works, login works, import succeeds, and private content remains hidden from public routes.

- [ ] **Step 8: Commit final verification fixes**

If verification changed files in frontend source files, run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault status --short
git -C /Users/baifengmei/Documents/code/toolvault add frontend/src/App.tsx frontend/src/api/client.ts frontend/src/pages/LoginPage.tsx frontend/src/pages/admin/AdminToolsPage.tsx frontend/src/pages/admin/ImportPage.tsx
git -C /Users/baifengmei/Documents/code/toolvault commit -m "fix: complete ToolVault MVP verification"
```

If verification changed backend source files, run:

```bash
git -C /Users/baifengmei/Documents/code/toolvault status --short
git -C /Users/baifengmei/Documents/code/toolvault add backend/app backend/tests
git -C /Users/baifengmei/Documents/code/toolvault commit -m "fix: complete ToolVault MVP verification"
```

Expected: commit succeeds when there are changes; if there are no changes, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Website project with database storage: covered by Tasks 1, 2, 6, 7.
- FastAPI + React/Vite + PostgreSQL + Tailwind + Alembic + Docker Compose: covered by Tasks 1, 5, 6, 7, 8, 9, 10.
- Claude-generated JSON import with reviewable payload: covered by Tasks 3, 4, 6, 7, 9.
- Public and login-only visibility: covered by Tasks 2, 6, 10.
- Admin import and editing foundation: covered by Tasks 6 and 9.
- Sensitive information handling: covered by Task 3 and import route validation in Task 6.
- Future skill/runbook candidates: covered by model fields in Task 2 and import upsert in Task 4.
- Verification with tests and browser flow: covered by Tasks 2 through 10.

Placeholder scan:

- The plan uses concrete file paths, code snippets, commands, and expected outcomes.
- The only angle-bracket syntax appears in a git command in Task 10 to indicate Git’s path argument position after verification discovers actual changed files; execution should replace it with the exact changed paths shown by `git status --short`.

Type consistency:

- Backend model field names match Pydantic schemas and frontend `Tool` type.
- Import service returns `created`, `updated`, and `import_id`, matching the frontend import page.
- Auth response returns `access_token` and `token_type`, matching the frontend login page.
