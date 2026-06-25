# ToolVault SaaS Visual Redesign Design

## Goal

Upgrade FM AI Tools Hub from a functional Tailwind CRUD-style interface into a cohesive AI SaaS product experience while preserving the current page features, data contracts, navigation behavior, and update-log audit flow.

The redesign should make the public site feel like a polished AI tools product: strong landing-page first impression, consistent visual system, refined cards, clearer hierarchy, and dense but readable tool/workflow/update-log content.

## Confirmed direction

Use an **AI SaaS product website + tool console content density** direction.

This means:

- The home page should feel like a SaaS landing page with a strong hero, product framing, polished CTA buttons, and feature sections.
- Tool-heavy pages should keep practical information density, but style it like an app directory, solution library, product docs, or release-note audit trail rather than plain cards.
- The design should be unified across the full site, including public pages and admin pages.
- The result should not feel like a generic template or a default Tailwind starter.

## Scope

### In scope

Redesign the frontend presentation for:

- `/`
- `/tools`
- `/tools/:slug`
- `/workflows`
- `/workflows?tab=prompts`
- `/workflows?tab=commands`
- `/guides`
- `/updates`
- `/login`
- `/admin/tools`
- `/admin/imports`

Keep all existing behavior working:

- Public tool browsing.
- Tool type filtering.
- Tool detail guide browsing.
- Workflow / prompt / command tabs.
- Legacy `/prompts` and `/commands` redirects.
- Update-log collapse and internal tabs.
- Admin login.
- JSON import.
- Private tool visibility rules.

### Out of scope

Do not change:

- Backend API shape.
- Database schema.
- Import payload schema.
- Update-log data model.
- Markdown guide content generation.
- Authentication behavior.
- Sensitive scan behavior.
- Daily update CLI behavior.

Do not add:

- A new UI component library.
- Dark mode.
- New backend dependencies.
- New content-writing automation.
- New public/private visibility rules.

## Visual system

### Background and page shell

Replace the plain body background with a more product-like SaaS surface:

- Soft off-white base.
- Subtle blue/purple radial glows near the top of the page.
- Optional fine grid or noise-like gradient using CSS only.
- Keep text readable and high contrast.

The layout should use a wider main container, roughly `max-w-7xl`, so long Chinese descriptions do not wrap too early on wide screens.

### Navigation

Upgrade the header into a floating SaaS nav:

- Sticky at top.
- Semi-transparent white surface.
- Backdrop blur.
- Rounded container inside the viewport.
- Current page link styling.
- Clear product mark for `FM AI Tools Hub`.

Keep the current public navigation entries:

- 工具库
- 工作流
- 使用指南
- 更新日志
- 后台登录

Do not restore standalone `提示词` or `命令速查` top-level nav links.

### Typography

Use the existing font stack, but improve hierarchy through spacing, size, weight, and color:

- Hero headings should feel more intentional and product-like.
- Page descriptions should use wider text blocks where the hero has enough room.
- Dense content should use compact but readable line-height.
- Long Chinese text must avoid awkward early wrapping caused by overly narrow `max-width` values.

### Cards and surfaces

Create a unified surface style:

- White or translucent card backgrounds.
- Subtle border.
- Soft shadow.
- Rounded corners.
- Optional gradient accent on important cards.
- Hover lift for clickable public cards.

Use this style consistently for feature cards, tool cards, workflow cards, guide cards, metric cards, release-note cards, and admin cards.

### Buttons and badges

Buttons should not look like default Tailwind examples:

- Primary CTA: blue/purple gradient, stronger presence.
- Secondary CTA: white or translucent surface with border.
- Small links: refined text link with arrow or subtle hover.

Badges should be consistent:

- Tool type.
- Tool status.
- Validation status.
- Update status.
- Visibility where needed.

## Shared component plan

Introduce lightweight frontend components under `frontend/src/components`.

### `PageHero`

Purpose: shared page hero for major pages.

Responsibilities:

- Render eyebrow, title, description, optional actions, and optional children.
- Support visual variants such as light, dark, and product-gradient.
- Ensure description width can be wider than the old `max-w-3xl` where appropriate.

Used by:

- Home page.
- Tool list page.
- Tool detail page.
- Workflow page.
- Guide navigation page.
- Update log page.
- Login/admin pages in a simpler variant.

### `SurfaceCard`

Purpose: shared card/surface primitive.

Responsibilities:

- Provide consistent rounded corners, border, shadow, background, hover state, and padding.
- Support clickable and static variants.
- Support optional accent or gradient styling.

Used by:

- Home navigation cards.
- Tool cards.
- Tool detail sections.
- Workflow cards.
- Guide cards.
- Update-log articles.
- Admin cards.

### `MetricCard`

Purpose: compact data card.

Used by:

- Update log summary metrics.
- Home page quick stats if available from current data.

### `SectionHeader`

Purpose: consistent section heading inside pages.

Responsibilities:

- Render eyebrow, title, description, and optional right-side action.
- Avoid repeated ad-hoc section title markup.

### `Pill` and `StatusBadge`

Purpose: consistent small labels.

Used for:

- Tool type.
- Tool status.
- Validation result.
- Update result.
- Visibility where needed.

### `SegmentedTabs`

Purpose: consistent tab styling.

Used by:

- Workflow page main tabs.
- Update log execution detail tabs.

Must preserve accessible tab behavior:

- `role="tablist"`
- `role="tab"`
- `role="tabpanel"`
- `aria-selected`
- `aria-controls`
- `aria-labelledby`

### `CommandBlock`

Purpose: refined command display.

Used by:

- Tool detail command sections.
- Workflow command tab.
- Guide examples.

It should look like a command palette or code terminal snippet without turning the whole page into a dark terminal UI.

## Page designs

### Home page `/`

Turn the home page into a SaaS landing page.

Design requirements:

- Use a strong product hero with gradient glow and clear product value proposition.
- Keep the two core CTAs: browse tools and view workflows.
- Present dynamic home highlights as a “today’s AI workflow intelligence” or similar capability matrix.
- Convert the six navigation cards into a polished feature grid with stronger visual hierarchy.
- Include a concise trust/safety strip explaining public sources, sensitive scanning, update logs, and traceability.

Keep existing dynamic behavior:

- Loading state for daily recommendation content.
- Error state for daily recommendation content.
- Empty highlight state.
- Tool links inside highlights.

### Tool list page `/tools`

Turn the tool library into an app directory / integration marketplace.

Design requirements:

- Add a product-style hero explaining that this is the AI tools capability directory.
- Upgrade search and type filter into a single refined filter bar.
- Tool cards should show:
  - Tool name.
  - Tool type.
  - Tool status if available from the current API model.
  - Summary.
  - A clear “查看指南” or equivalent entry.
- Tool cards must not show tag lists.
- Preserve type filtering behavior.
- Preserve search behavior.

### Tool detail page `/tools/:slug`

Turn each tool detail page into a product detail / documentation page.

Design requirements:

- Use a hero with tool name, type, status, summary, and important actions or command anchors.
- Split content into refined cards for:
  - Basic information.
  - Install command.
  - Verify command.
  - Guides.
  - Related metadata.
- Markdown guide content should remain readable and feel like documentation.
- The guide table of contents should remain visible and easy to use.
- The page should support long Chinese guide content without cramped line lengths.

### Workflow page `/workflows`

Turn workflows into a solutions page.

Design requirements:

- Hero should frame the page as “from task to validated result” workflows.
- Main tabs should become a polished segmented control using `SegmentedTabs`.
- Workflow tab should present workflows as solution cards or step/timeline cards.
- Prompt tab should present prompt groups as recipe cards.
- Command tab should present command groups using command-palette-like blocks.
- Safety notes should appear as a prominent policy/safety card near the command content.

Preserve current tab URLs:

- `/workflows`
- `/workflows?tab=prompts`
- `/workflows?tab=commands`

### Guide navigation page `/guides`

Turn the page into a getting-started / decision guide.

Design requirements:

- Use a polished onboarding hero.
- Present “MCP 是什么”, “MCP 装了以后怎么使用”, “怎么选择工具”, and safety guidance as deliberate guide cards instead of plain content blocks.
- Use decision matrix or scenario cards where current content supports it.
- Keep public tool links working.
- Keep safety notes prominent and easy to scan.

### Update log page `/updates`

Turn update logs into release notes / audit trail.

Design requirements:

- Hero should emphasize traceability, validation, and sensitive-scan safety.
- Summary metrics should become polished metric cards.
- Log entries should look like release-note timeline items.
- Default log rows should remain compact.
- Expanded logs must preserve the previously confirmed structure:
  - Compact overview in up to three detail rows.
  - No per-log content-plan checklist display.
  - Collapsible execution detail section.
  - Internal tabs for `执行结果报告` and `具体更新内容`.
  - Compact key=value report chips.
  - Friendly labels for historical `/prompts` and `/commands` links.

### Login and admin pages

Make admin pages visually consistent but not overly marketing-heavy.

Design requirements:

- Login page should become a centered SaaS auth card.
- Admin list/import pages should use the same card, input, button, badge, and section styles as the public site.
- Preserve all existing admin workflows.

## Data flow

No backend data flow changes are required.

Existing frontend data sources remain:

- `/api/tools`
- `/api/tools/:slug`
- `/api/page-content`
- `/api/update-logs`
- Admin import endpoints already used by the current pages.

The redesign should be a presentation-layer change only.

## Error and loading states

Keep all current loading, empty, and error states, but restyle them using the shared surface system.

Required states:

- Home page highlight loading/error/empty.
- Tool list loading/error/empty.
- Tool detail loading/error/not found.
- Page content loading/error where used.
- Update log loading/error/empty.
- Login/admin form errors.
- Import success/failure status.

## Accessibility requirements

- Preserve semantic headings.
- Preserve links as links, buttons as buttons.
- Preserve accessible tab roles and selected states.
- Ensure color contrast remains readable on gradient surfaces.
- Do not hide critical text behind hover-only interactions.
- Keep keyboard navigation functional for tabs, links, and admin forms.

## Testing plan

### Automated checks

Run after implementation:

```bash
npm --prefix frontend run build
```

Run existing E2E coverage, including:

- Public tool detail browsing.
- Workflow, prompt, and command tabs.
- Update log browsing and execution detail tabs.
- Guide page and legacy redirects.
- Tool type filtering.
- Admin import.
- Private tool visibility.
- Invalid import JSON handling.

### E2E expectations to preserve or add

- Home page still links to tool library and workflows.
- Tool cards do not show tag labels.
- Workflow tabs preserve `aria-selected` behavior.
- Update log entries still collapse/expand and internal tabs still work.
- Tool detail guide navigation remains visible.
- Login and admin import remain usable under the redesigned layout.

### Browser acceptance

After implementation, use the running app in a browser and inspect:

- `/`
- `/tools`
- one public tool detail page such as `/tools/playwright-mcp` when available.
- `/workflows`
- `/workflows?tab=prompts`
- `/workflows?tab=commands`
- `/guides`
- `/updates`
- `/login`
- `/admin/tools`
- `/admin/imports`

Acceptance criteria:

- The site feels like a cohesive AI SaaS product.
- It no longer looks like a generic template or simple CRUD UI.
- Chinese long text does not wrap awkwardly on wide screens.
- Cards are readable and not overly dense.
- Public and admin flows still work.
- Browser console has no new errors.

## Risks and mitigations

### Risk: over-styling reduces readability

Mitigation: keep content cards mostly light, reserve gradients for hero and accents, and verify long Chinese content in browser.

### Risk: component extraction causes regressions

Mitigation: introduce shared components incrementally and keep page data flow unchanged.

### Risk: E2E tests break due to role/name changes

Mitigation: preserve semantic headings, links, buttons, and tab roles. Update tests only when user-visible wording intentionally changes.

### Risk: admin pages become less practical

Mitigation: use the same visual system, but keep admin layout compact and form-first.

## Implementation principle

This redesign should be a front-end visual system and composition upgrade, not a product behavior rewrite. The implementation should improve perceived quality while preserving existing behavior, routes, API contracts, and security boundaries.
