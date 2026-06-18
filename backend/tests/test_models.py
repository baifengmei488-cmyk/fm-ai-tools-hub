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
