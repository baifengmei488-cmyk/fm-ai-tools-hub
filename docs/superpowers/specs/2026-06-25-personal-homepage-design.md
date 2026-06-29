# Personal Homepage Design

## Goal

Add a public personal homepage inside ToolVault that presents FM as a person who connects testing quality, business understanding, workflow automation, product thinking, and AI tooling. The page should feel like a personal summary and portfolio, not a resume delivery page and not an explicit job-search page.

## Scope

Build one static frontend page at `/about` and add it to the main navigation. The page does not require backend changes, authentication, new dependencies, dynamic data, or resume download support.

## Audience

- People who want to understand FM's background, work style, projects, and direction.
- Interviewers or collaborators evaluating RPA/Python automation, testing quality, B-side process productization, or AI tooling work.
- FM herself, as a shareable public summary of past work and future direction.

## Content Boundaries

- Do not show FM's real name.
- Do not show phone number.
- Show contact methods only as:
  - Email: `write218@163.com`
  - WeChat: `bfm_135`
- Do not use words like “求职”, “找工作”, “投递”, or direct job-seeking calls to action.
- Do not provide a resume download or “查看简历” entry.
- Real public platform names such as 天猫、抖音、京东、拼多多 can appear.
- Do not expose internal confidential information, credentials, private URLs, customer data, or production connection strings.

## Tone

The wording should be professional, measured, warm, and modest. Avoid two extremes:

- Too rigid: no dry resume-style list of abilities.
- Too boastful: no absolute claims such as “最权威”, “全面掌控”, or “精通一切”.

Use phrasing that sounds like a real personal summary: “我比较习惯…”, “我会先…”, “我更关注…”, “逐渐形成…”. Keep evidence grounded in projects.

## Page Route and Navigation

- Route: `/about`
- Main nav label: `关于 FM`
- Put the nav item before `后台登录`.

## Page Structure

### 1. Hero: positioning and contact

Purpose: explain FM's broad line in one glance without sounding like a resume headline.

Suggested headline:

> 从复杂业务系统测试，到业务流程自动化落地。

Suggested subtitle:

> 我更关注一件事能不能被真正理解、验证和交付。从测试负责人到 RPA 自动化实践，再到 AI 工具知识库建设，我一直在做的，是把复杂流程拆清楚，把可重复的工作自动化，把经验沉淀成别人也能使用的工具和方法。

Hero keyword chips:

- 测试质量
- 业务理解
- 跨部门沟通
- Python 自动化
- Playwright
- 数据处理
- RPA 运维
- AI 工具

Right-side contact card:

- Display name: `FM`
- Description: `业务自动化 / RPA / 测试质量 / AI 工具`
- Email: `write218@163.com`
- WeChat: `bfm_135`

### 2. 我擅长的事

Use this section as the page's most personal part. It should not be a stiff ability table. Use short readable paragraphs or soft cards.

Approved wording direction:

> 我比较习惯先把事情想清楚，再去做。面对一个软件需求、一个流程问题，或者一个看起来很复杂的系统，我通常会先去问：它要解决谁的问题？现在卡在哪里？输入是什么，输出是什么？哪些地方容易出错？最后怎么判断它真的做好了？
>
> 因为做过较长时间测试负责人，我接触过的角色和环节比较多：业务、产品、开发、后台、数据库、运维、运营，还有各种工具和系统。很多东西我未必一开始就很精，但我比较愿意把它们放在一起看，先理解整体关系，再判断哪里是关键问题，哪里需要深入。
>
> 我也比较在意表达。不管是和人沟通，还是和 AI 协作，我都会尽量把背景、目标、限制、步骤和判断标准说清楚。对我来说，很多问题不是不会做，而是前面没有想明白、没有说清楚，后面就很容易反复。
>
> 我对细节会比较有耐心。遇到一个厉害的工具、一个复杂的流程，或者一个别人做得很好的东西，我会想知道它为什么能这样运转，背后的逻辑是什么。如果已经开始接触一个方向，我会希望尽量理解得更深入一点，而不是只停留在会用。
>
> 我理解开发实现有成本，也理解系统不可能完美。但我还是会比较在意用户最终怎么使用、是否容易理解、出错后有没有办法补救、结果能不能被复核。也正因为这样，我做自动化项目时，不太愿意只停在“脚本能跑”，而是会继续想它怎么配置、怎么记录、怎么补跑、怎么交接。
>
> 这也是我现在想沉淀的方向：把业务理解、质量意识、自动化开发和 AI 工具使用结合起来，做一些真正能帮助人把复杂事情理清楚、跑起来、交付出去的工具和方法。

### 3. Representative works

Show two main works.

#### Work 1: RPA 自动化项目群

Summary:

> 围绕电商财务、发票、结算、登录态、任务调度和运维交接，将多平台、多系统、多文件、多规则的人工流程，整理为可配置、可追踪、可补跑的自动化项目群。

Key evidence:

- 多平台发票自动化：天猫、抖音、京东、拼多多等。
- 多平台结算核对：账单下载、数据清洗、费用映射、差异核对。
- 统一登录态模块：storage_state / Profile / 多平台登录助手。
- RPA 管理平台：任务启动/停止、Cron 定时、日志、成功率统计。
- Runbook / PRD / Skills：把项目交付经验沉淀为可复用方法。

Abilities shown:

- 业务流程拆解。
- Playwright 浏览器自动化。
- pandas / openpyxl 数据处理。
- API 集成。
- 幂等补跑。
- 交付与运维意识。

#### Work 2: ToolVault / FM AI Tools Hub

Summary:

> 一个 local-first 的 AI 工具知识库，把 Claude Code、MCP、skills、CLI 和日常开发测试工具整理成工具目录、使用指南、工作流、提示词、命令清单和更新日志。

Key evidence:

- FastAPI + SQLAlchemy + React + Vite + Tailwind.
- 工具目录与详情页。
- Markdown 使用指南安全渲染。
- 导入 payload schema。
- 敏感信息扫描。
- 更新日志与 page_content。
- Playwright E2E 与浏览器验证。
- AI 工具工作流沉淀。

Abilities shown:

- 产品设计。
- 全栈实现。
- AI 工具应用。
- 安全意识。
- 测试验证。
- 知识产品化。

### 4. 能力证据

Use six cards. Keep the text grounded and not over-claiming.

1. **业务与需求理解**
   - From user, business, product, development, and testing angles, identify roles, inputs, outputs, exception paths, and acceptance criteria.

2. **测试质量与风险识别**
   - Testing lead background; focus on requirement review, test planning, defect tracking, release acceptance, and quality risks.

3. **自动化开发与数据处理**
   - Python, Playwright, pandas, openpyxl, requests; browser automation, API calls, and complex Excel/data processing.

4. **流程稳定性与运维交付**
   - Task state, retry, idempotent rerun, logs, screenshots, shared folder delivery, notification, and handover.

5. **产品化与文档沉淀**
   - PRD, Runbook, requirement matrix, acceptance checklist, skills, and knowledge base.

6. **AI 工具与人机协作**
   - Claude Code, MCP, AI tools for code understanding, workflow organization, issue investigation, and knowledge capture.

### 5. 我正在沉淀的方向

Do not call this “求职方向”. Use it as a thoughtful closing section.

Suggested text:

> 我更感兴趣的是那些连接业务、系统和人的问题：如何把复杂流程讲清楚、跑稳定、交付出去；如何让自动化不只是脚本，而是可配置、可验证、可维护的业务工具；如何把 AI 工具用在真实工作流里，而不是停留在演示和概念上。

Direction tags:

- 业务流程自动化
- RPA / Python 自动化
- 测试质量与验收
- B 端流程产品
- AI 工具应用
- 内部效率工具

### 6. Footer contact

Simple closing:

> 如果你对这些项目、方法或工具感兴趣，可以通过以下方式联系我。

Contact:

- Email: `write218@163.com`
- WeChat: `bfm_135`

## Visual Design Requirements

- Match current ToolVault style: compact, readable, rounded cards, slate/blue palette, small uppercase labels, dense but not crowded content.
- The page should feel like part of FM AI Tools Hub, not a separate resume website.
- Use responsive grids:
  - Hero: two-column on desktop, single-column on mobile.
  - Strengths and evidence: cards/grid.
  - Representative works: two large cards.
- Avoid decorative excess; content clarity matters more than animation.

## Technical Design

- Create `frontend/src/pages/AboutPage.tsx`.
- Register route in `frontend/src/App.tsx`.
- Add nav item in `frontend/src/components/Layout.tsx`.
- Keep all content static inside `AboutPage.tsx` for now.
- Do not add backend APIs or database fields.
- Do not import resume files or external documents at runtime.

## Validation

- `npm --prefix frontend run build` should pass.
- `/about` should render without authentication.
- Main nav should show `关于 FM` and highlight when active.
- Existing routes should remain unchanged.
- Browser verification should open `/about` and confirm:
  - no real name is shown,
  - phone number is not shown,
  - email and WeChat are shown,
  - page does not contain “求职”, “找工作”, or “投递”,
  - representative RPA and ToolVault sections render.

## Self-Review

- Placeholder scan: no unfinished placeholder markers remain.
- Scope check: single static page plus route/nav only; no backend or schema changes.
- Ambiguity check: real name and phone are explicitly excluded; email and WeChat are explicitly allowed.
- Tone check: wording should be warm, measured, and modest; avoid rigid resume-style overclaiming.
