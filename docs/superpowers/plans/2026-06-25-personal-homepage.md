# Personal Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `/about` personal homepage that presents FM's testing, business understanding, RPA automation, productization, and AI tooling work without exposing real name, phone, or explicit job-search wording.

**Architecture:** Implement one self-contained static React page and register it in the existing React Router shell. Keep all copy and display data inside `AboutPage.tsx`; update only route/navigation and E2E coverage. No backend, database, import payload, or dependency changes are needed.

**Tech Stack:** React, TypeScript, React Router, Vite, Tailwind CSS, Playwright E2E.

---

## File Structure

```text
toolvault/
  frontend/src/App.tsx                         # Add /about route and AboutPage import
  frontend/src/components/Layout.tsx           # Add main navigation item: 关于 FM
  frontend/src/pages/AboutPage.tsx             # New static personal homepage page
  frontend/e2e/toolvault.spec.ts               # Add public /about browser coverage
  docs/superpowers/specs/2026-06-25-personal-homepage-design.md
  docs/superpowers/plans/2026-06-25-personal-homepage.md
```

---

### Task 1: Add E2E Coverage for Public About Page

**Files:**
- Modify: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Add a failing Playwright test before implementation**

Append this test after `public users can browse guide page and legacy workflow redirects` and before `public users can filter tools by type radio buttons`:

```ts
test('public users can browse the personal homepage without resume-style wording', async ({ page }) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { name: '从复杂业务系统测试，到业务流程自动化落地。' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '我擅长的事' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '代表作品' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'RPA 自动化项目群' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ToolVault / FM AI Tools Hub' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '我正在沉淀的方向' })).toBeVisible();

  await expect(page.getByText('write218@163.com')).toBeVisible();
  await expect(page.getByText('bfm_135')).toBeVisible();
  await expect(page.getByText('白凤梅')).toHaveCount(0);
  await expect(page.getByText(/电话|手机/)).toHaveCount(0);
  await expect(page.getByText(/求职|找工作|投递/)).toHaveCount(0);
  await expect(page.getByText(/下载简历|查看简历/)).toHaveCount(0);
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run from repo root:

```bash
npm --prefix frontend run e2e -- --grep "personal homepage"
```

Expected: FAIL because `/about` is not registered yet or the expected headings do not exist.

- [ ] **Step 3: Keep failure output for comparison**

Record the failing assertion or 404/missing route output. Do not edit implementation until the failing test proves the missing behavior.

---

### Task 2: Create Static About Page Component

**Files:**
- Create: `frontend/src/pages/AboutPage.tsx`

- [ ] **Step 1: Create `AboutPage.tsx` with static content arrays**

Create the file with this complete component:

```tsx
const heroChips = ['测试质量', '业务理解', '跨部门沟通', 'Python 自动化', 'Playwright', '数据处理', 'RPA 运维', 'AI 工具'];

const strengths = [
  '我比较习惯先把事情想清楚，再去做。面对一个软件需求、一个流程问题，或者一个看起来很复杂的系统，我通常会先去问：它要解决谁的问题？现在卡在哪里？输入是什么，输出是什么？哪些地方容易出错？最后怎么判断它真的做好了？',
  '因为做过较长时间测试负责人，我接触过的角色和环节比较多：业务、产品、开发、后台、数据库、运维、运营，还有各种工具和系统。很多东西我未必一开始就很精，但我比较愿意把它们放在一起看，先理解整体关系，再判断哪里是关键问题，哪里需要深入。',
  '我也比较在意表达。不管是和人沟通，还是和 AI 协作，我都会尽量把背景、目标、限制、步骤和判断标准说清楚。对我来说，很多问题不是不会做，而是前面没有想明白、没有说清楚，后面就很容易反复。',
  '我对细节会比较有耐心。遇到一个厉害的工具、一个复杂的流程，或者一个别人做得很好的东西，我会想知道它为什么能这样运转，背后的逻辑是什么。如果已经开始接触一个方向，我会希望尽量理解得更深入一点，而不是只停留在会用。',
  '我理解开发实现有成本，也理解系统不可能完美。但我还是会比较在意用户最终怎么使用、是否容易理解、出错后有没有办法补救、结果能不能被复核。也正因为这样，我做自动化项目时，不太愿意只停在“脚本能跑”，而是会继续想它怎么配置、怎么记录、怎么补跑、怎么交接。',
  '这也是我现在想沉淀的方向：把业务理解、质量意识、自动化开发和 AI 工具使用结合起来，做一些真正能帮助人把复杂事情理清楚、跑起来、交付出去的工具和方法。',
];

const works = [
  {
    mark: 'RPA',
    title: 'RPA 自动化项目群',
    summary:
      '围绕电商财务、发票、结算、登录态、任务调度和运维交接，将多平台、多系统、多文件、多规则的人工流程，整理为可配置、可追踪、可补跑的自动化项目群。',
    items: [
      '多平台发票自动化：天猫、抖音、京东、拼多多等。',
      '多平台结算核对：账单下载、数据清洗、费用映射、差异核对。',
      '统一登录态模块：storage_state / Profile / 多平台登录助手。',
      'RPA 管理平台：任务启动/停止、Cron 定时、日志、成功率统计。',
      'Runbook / PRD / Skills：把项目交付经验沉淀为可复用方法。',
    ],
    tags: ['业务流程拆解', 'Playwright', 'pandas / openpyxl', 'API 集成', '幂等补跑', '运维交付'],
  },
  {
    mark: 'AI',
    title: 'ToolVault / FM AI Tools Hub',
    summary:
      '一个 local-first 的 AI 工具知识库，把 Claude Code、MCP、skills、CLI 和日常开发测试工具整理成工具目录、使用指南、工作流、提示词、命令清单和更新日志。',
    items: [
      'FastAPI + SQLAlchemy + React + Vite + Tailwind。',
      '工具目录、详情页和 Markdown 使用指南安全渲染。',
      '导入 payload schema、敏感信息扫描和更新日志。',
      'page_content 管理工作流、提示词、命令清单和导航内容。',
      'Playwright E2E、浏览器验证和 AI 工具工作流沉淀。',
    ],
    tags: ['产品设计', '全栈实现', 'AI 工具应用', '安全意识', '测试验证', '知识产品化'],
  },
];

const evidenceCards = [
  {
    title: '业务与需求理解',
    text: '从用户、业务、产品、开发、测试多个角度理解流程，拆出角色、输入输出、异常路径和验收标准。',
  },
  {
    title: '测试质量与风险识别',
    text: '测试负责人背景，关注需求评审、测试计划、缺陷跟踪、上线验收和质量风险。',
  },
  {
    title: '自动化开发与数据处理',
    text: '使用 Python、Playwright、pandas、openpyxl、requests 处理浏览器自动化、接口调用和复杂数据。',
  },
  {
    title: '流程稳定性与运维交付',
    text: '关注任务状态、失败重试、幂等补跑、日志截图、共享目录、通知和交接。',
  },
  {
    title: '产品化与文档沉淀',
    text: '把分散经验整理成 PRD、Runbook、需求矩阵、验收清单、Skills 和知识库。',
  },
  {
    title: 'AI 工具与人机协作',
    text: '使用 Claude Code、MCP 和 AI 工具辅助代码理解、流程整理、问题排查和知识沉淀。',
  },
];

const directionTags = ['业务流程自动化', 'RPA / Python 自动化', '测试质量与验收', 'B 端流程产品', 'AI 工具应用', '内部效率工具'];

export function AboutPage() {
  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white shadow-sm ring-1 ring-slate-900/10 md:px-6">
          <p className="text-xs font-black uppercase tracking-wide text-blue-200">Business Automation · RPA · AI Tooling</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight md:text-4xl">从复杂业务系统测试，到业务流程自动化落地。</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200 md:text-base md:leading-7">
            我更关注一件事能不能被真正理解、验证和交付。从测试负责人到 RPA 自动化实践，再到 AI 工具知识库建设，我一直在做的，是把复杂流程拆清楚，把可重复的工作自动化，把经验沉淀成别人也能使用的工具和方法。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {heroChips.map((chip) => (
              <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-100 ring-1 ring-white/15">
                {chip}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">FM</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">About FM</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">业务自动化 / RPA / 测试质量 / AI 工具</h2>
            </div>
          </div>
          <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm ring-1 ring-slate-100">
            <p className="font-semibold text-slate-700">邮箱：<a className="text-blue-700 hover:text-blue-900" href="mailto:write218@163.com">write218@163.com</a></p>
            <p className="font-semibold text-slate-700">微信：<span className="text-slate-950">bfm_135</span></p>
          </div>
        </aside>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
        <p className="text-xs font-black uppercase tracking-wide text-blue-700">How I Work</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">我擅长的事</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {strengths.map((text, index) => (
            <article key={text} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white">{index + 1}</span>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">Representative Works</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">代表作品</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">两个项目方向分别对应业务流程自动化和 AI 工具产品化，也承接了测试质量、产品设计和交付意识。</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {works.map((work) => (
            <article key={work.title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">{work.mark}</span>
                <div>
                  <h3 className="text-lg font-black text-slate-950">{work.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{work.summary}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                {work.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {work.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-100">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
        <p className="text-xs font-black uppercase tracking-wide text-blue-700">Evidence Map</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">能力证据</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {evidenceCards.map((card) => (
            <article key={card.title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <h3 className="text-base font-black text-slate-950">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm ring-1 ring-slate-900/10">
          <p className="text-xs font-black uppercase tracking-wide text-blue-200">Direction</p>
          <h2 className="mt-1 text-xl font-black">我正在沉淀的方向</h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            我更感兴趣的是那些连接业务、系统和人的问题：如何把复杂流程讲清楚、跑稳定、交付出去；如何让自动化不只是脚本，而是可配置、可验证、可维护的业务工具；如何把 AI 工具用在真实工作流里，而不是停留在演示和概念上。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {directionTags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-100 ring-1 ring-white/15">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Contact</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">联系</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">如果你对这些项目、方法或工具感兴趣，可以通过以下方式联系我。</p>
          <div className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
            <p>邮箱：<a className="text-blue-700 hover:text-blue-900" href="mailto:write218@163.com">write218@163.com</a></p>
            <p>微信：<span className="text-slate-950">bfm_135</span></p>
          </div>
        </aside>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Check static content boundaries**

Search the new file content manually or with the command below:

```bash
grep -nE '白凤梅|电话|手机|求职|找工作|投递|下载简历|查看简历' frontend/src/pages/AboutPage.tsx || true
```

Expected: no output.

---

### Task 3: Register Route and Navigation

**Files:**
- Modify: `frontend/src/App.tsx:1-29`
- Modify: `frontend/src/components/Layout.tsx:1-9`

- [ ] **Step 1: Import AboutPage in App**

Add this import after `HomePage`:

```ts
import { AboutPage } from './pages/AboutPage';
```

- [ ] **Step 2: Register `/about` route**

In `frontend/src/App.tsx`, add the route after the index route:

```ts
{ path: 'about', element: <AboutPage /> },
```

The route block should become:

```ts
children: [
  { index: true, element: <HomePage /> },
  { path: 'about', element: <AboutPage /> },
  { path: 'tools', element: <ToolListPage /> },
  { path: 'tools/:slug', element: <ToolDetailPage /> },
  { path: 'workflows', element: <WorkflowPage /> },
  { path: 'prompts', element: <Navigate to="/workflows?tab=prompts" replace /> },
  { path: 'commands', element: <Navigate to="/workflows?tab=commands" replace /> },
  { path: 'guides', element: <GuideNavigationPage /> },
  { path: 'updates', element: <UpdateLogPage /> },
  { path: 'login', element: <LoginPage /> },
  { path: 'admin/tools', element: <AdminToolsPage /> },
  { path: 'admin/imports', element: <ImportPage /> },
],
```

- [ ] **Step 3: Add nav item**

In `frontend/src/components/Layout.tsx`, update `navItems` to:

```ts
const navItems = [
  { to: '/about', label: '关于 FM' },
  { to: '/tools', label: '工具库' },
  { to: '/workflows', label: '工作流' },
  { to: '/guides', label: '使用指南' },
  { to: '/updates', label: '更新日志' },
  { to: '/login', label: '后台登录' },
];
```

- [ ] **Step 4: Run the E2E test again**

Run from repo root:

```bash
npm --prefix frontend run e2e -- --grep "personal homepage"
```

Expected: PASS.

---

### Task 4: Build and Runtime Verification

**Files:**
- No source edits expected unless verification exposes a defect.

- [ ] **Step 1: Run frontend build**

Run from repo root:

```bash
npm --prefix frontend run build
```

Expected: TypeScript and Vite build exit 0.

- [ ] **Step 2: Run the app with explicit ports**

Run from repo root:

```bash
TOOLVAULT_BACKEND_PORT=8188 TOOLVAULT_FRONTEND_PORT=5288 scripts/run-dev.sh
```

Expected output includes:

```text
ToolVault is running:
- Frontend: http://127.0.0.1:5288
- Backend API: http://127.0.0.1:8188
```

- [ ] **Step 3: Verify `/about` in a browser**

Open:

```text
http://127.0.0.1:5288/about
```

Expected visible content:

```text
从复杂业务系统测试，到业务流程自动化落地。
我擅长的事
代表作品
RPA 自动化项目群
ToolVault / FM AI Tools Hub
能力证据
我正在沉淀的方向
write218@163.com
bfm_135
```

Expected absent content:

```text
白凤梅
电话
手机
求职
找工作
投递
下载简历
查看简历
```

- [ ] **Step 4: Probe navigation**

In the browser:

1. Click `关于 FM` in the main nav.
2. Confirm URL is `/about`.
3. Confirm `关于 FM` uses the active nav style.
4. Click `工具库` and confirm existing `/tools` still renders.

- [ ] **Step 5: Check console warnings/errors**

Use Playwright console inspection or browser devtools.

Expected: no console errors for `/about`.

---

## Self-Review

Spec coverage:
- `/about` route: Task 3.
- Navigation label `关于 FM`: Task 3.
- Static page content and style: Task 2.
- Contact boundaries: Task 2 and Task 4.
- No real name, phone, job-search wording, or resume download: Task 1, Task 2, Task 4.
- RPA and ToolVault representative works: Task 2.
- Runtime/browser verification: Task 4.

Placeholder scan:
- No unfinished placeholder markers are present in this plan.
- All changed code blocks are complete.

Type consistency:
- Component is exported as `AboutPage` and imported as `AboutPage`.
- Route path is `about`, matching browser URL `/about`.
- Navigation label is exactly `关于 FM`, matching E2E/browser expectations.
