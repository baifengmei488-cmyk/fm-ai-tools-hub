# ToolVault SaaS Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade FM AI Tools Hub into a cohesive AI SaaS product-style interface while preserving existing routes, APIs, accessibility behavior, update-log interactions, and admin workflows.

**Architecture:** Keep backend and data contracts unchanged. Add a small frontend design system under `frontend/src/components`, then migrate page presentation incrementally: shell and shared primitives first, public pages next, admin pages last, with E2E assertions guarding behavior after each page group.

**Tech Stack:** React, TypeScript, React Router, Tailwind CSS v4, Vite, Playwright E2E, existing FastAPI backend APIs.

---

## File structure

### Create

- `frontend/src/components/ui.tsx` — shared visual primitives: `PageHero`, `SurfaceCard`, `MetricCard`, `SectionHeader`, `Pill`, `StatusBadge`, `GradientButton`, `SecondaryButton`, `TextLink`, `SegmentedTabs`, `CommandBlock`, and state surfaces.

### Modify

- `frontend/src/styles.css` — SaaS background, base font smoothing, reusable visual utility classes when Tailwind class composition is awkward.
- `frontend/src/components/Layout.tsx` — floating SaaS navigation, wider container, active nav state.
- `frontend/src/pages/HomePage.tsx` — SaaS landing page treatment and polished feature grid.
- `frontend/src/pages/ToolListPage.tsx` — app-directory hero, filter bar, redesigned tool cards without tags.
- `frontend/src/pages/ToolDetailPage.tsx` — product detail hero, command cards, improved guide shell.
- `frontend/src/pages/WorkflowPage.tsx` — solution page hero, shared segmented tabs, workflow/prompt/command card refinements.
- `frontend/src/pages/GuideNavigationPage.tsx` — getting-started / decision-guide card layout.
- `frontend/src/pages/UpdateLogPage.tsx` — release-notes / audit-trail styling while preserving collapse and tabs.
- `frontend/src/pages/LoginPage.tsx` — centered SaaS auth card.
- `frontend/src/pages/admin/AdminToolsPage.tsx` — shared admin shell/card styling.
- `frontend/src/pages/admin/ImportPage.tsx` — shared admin import card, textarea, status, button styling.
- `frontend/e2e/toolvault.spec.ts` — add visual-system behavior assertions that do not overfit CSS, and preserve existing flows.

### Do not modify

- Backend services.
- Database migrations.
- Import payload schema.
- Daily update CLI behavior.
- Public/private visibility rules.

---

## Task 1: Add frontend visual primitives

**Files:**
- Create: `frontend/src/components/ui.tsx`
- Modify: `frontend/src/styles.css`
- Test: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Write a failing E2E assertion for the new SaaS shell landmark**

Add this assertion near the beginning of the first public browsing test in `frontend/e2e/toolvault.spec.ts`, after `await page.goto('/');` and before navigating away:

```ts
await expect(page.getByTestId('saas-page-shell')).toBeVisible();
await expect(page.getByRole('banner').getByRole('navigation', { name: '主导航' })).toBeVisible();
```

The start of the test should become:

```ts
test('public users can browse imported public tool details', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('saas-page-shell')).toBeVisible();
  await expect(page.getByRole('banner').getByRole('navigation', { name: '主导航' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'FM AI Tools Hub' })).toBeVisible();
```

- [ ] **Step 2: Run the failing E2E check**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse imported public tool details"
```

Expected: FAIL because `data-testid="saas-page-shell"` and `aria-label="主导航"` do not exist yet.

- [ ] **Step 3: Create `frontend/src/components/ui.tsx`**

Create the file with the following content:

```tsx
import { Link, type LinkProps } from 'react-router-dom';
import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  variant?: 'dark' | 'light' | 'gradient';
  align?: 'left' | 'center';
};

const heroVariantClassNames = {
  dark: 'overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 text-white shadow-2xl shadow-blue-950/20',
  light: 'overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 text-slate-950 shadow-xl shadow-slate-200/70 backdrop-blur',
  gradient: 'overflow-hidden rounded-[2rem] border border-white/20 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_32%),linear-gradient(135deg,#020617,#172554_52%,#312e81)] text-white shadow-2xl shadow-blue-950/25',
};

export function PageHero({ eyebrow, title, description, actions, children, variant = 'gradient', align = 'left' }: PageHeroProps) {
  const isDark = variant === 'dark' || variant === 'gradient';
  const alignment = align === 'center' ? 'mx-auto text-center' : '';

  return (
    <section className={heroVariantClassNames[variant]}>
      <div className="relative p-7 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className={`relative max-w-5xl ${alignment}`}>
          {eyebrow && <p className={`text-xs font-black uppercase tracking-[0.28em] ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{eyebrow}</p>}
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
          {description && <div className={`mt-5 max-w-5xl text-sm leading-7 sm:text-base sm:leading-8 ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>{description}</div>}
          {actions && <div className={`mt-7 flex flex-wrap gap-3 ${align === 'center' ? 'justify-center' : ''}`}>{actions}</div>}
        </div>
        {children && <div className="relative mt-8">{children}</div>}
      </div>
    </section>
  );
}

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  accent?: 'none' | 'blue' | 'violet' | 'emerald';
};

const accentClassNames = {
  none: '',
  blue: 'before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-blue-400/70 before:to-transparent',
  violet: 'before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-violet-400/70 before:to-transparent',
  emerald: 'before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-400/70 before:to-transparent',
};

export function SurfaceCard({ children, className = '', interactive = false, accent = 'none' }: SurfaceCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-xl shadow-slate-200/60 ring-1 ring-slate-900/5 backdrop-blur ${accentClassNames[accent]} ${
        interactive ? 'transition duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-100/70' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: ReactNode;
  description?: ReactNode;
};

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <SurfaceCard className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
    </SurfaceCard>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-4xl">
        {eyebrow && <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-700">{eyebrow}</p>}
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
        {description && <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

type PillProps = {
  children: ReactNode;
  tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
  className?: string;
};

const pillToneClassNames = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
};

export function Pill({ children, tone = 'slate', className = '' }: PillProps) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${pillToneClassNames[tone]} ${className}`}>{children}</span>;
}

export function StatusBadge({ children, tone = 'blue', className = '' }: PillProps) {
  return <Pill tone={tone} className={className}>{children}</Pill>;
}

type ButtonLikeProps = LinkProps & {
  children: ReactNode;
};

export function GradientButton({ children, className = '', ...props }: ButtonLikeProps) {
  return (
    <Link className={`inline-flex min-h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-violet-500 ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function SecondaryButton({ children, className = '', ...props }: ButtonLikeProps) {
  return (
    <Link className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/60 bg-white/80 px-5 py-2.5 text-sm font-black text-slate-800 shadow-sm backdrop-blur transition hover:bg-white ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function TextLink({ children, className = '', ...props }: ButtonLikeProps) {
  return (
    <Link className={`inline-flex items-center gap-1 text-sm font-black text-blue-700 transition hover:text-blue-900 ${className}`} {...props}>
      {children}<span aria-hidden="true">→</span>
    </Link>
  );
}

type SegmentedTabsProps<T extends string> = {
  tabs: Array<{ key: T; label: string; description?: string }>;
  activeTab: T;
  onSelect: (tab: T) => void;
  ariaLabel: string;
  idPrefix: string;
};

export function SegmentedTabs<T extends string>({ tabs, activeTab, onSelect, ariaLabel, idPrefix }: SegmentedTabsProps<T>) {
  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-2 shadow-xl shadow-slate-200/60 backdrop-blur" role="tablist" aria-label={ariaLabel}>
      <div className="grid gap-2 md:grid-cols-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${idPrefix}-${tab.key}-panel`}
              id={`${idPrefix}-${tab.key}-tab`}
              className={`rounded-2xl px-4 py-3 text-left transition ${isActive ? 'bg-slate-950 text-white shadow-lg shadow-slate-300/60' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}
              onClick={() => onSelect(tab.key)}
            >
              <span className="block font-black">{tab.label}</span>
              {tab.description && <span className={`mt-1 block text-xs leading-5 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{tab.description}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type CommandBlockProps = {
  label?: string;
  command: string;
};

export function CommandBlock({ label, command }: CommandBlockProps) {
  return (
    <div>
      {label && <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>}
      <pre className="mt-2 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-100 shadow-inner"><code>{command}</code></pre>
    </div>
  );
}

type StateSurfaceProps = {
  children: ReactNode;
  tone?: 'slate' | 'red' | 'amber';
};

export function StateSurface({ children, tone = 'slate' }: StateSurfaceProps) {
  const toneClassName = tone === 'red' ? 'border-red-100 bg-red-50 text-red-700' : tone === 'amber' ? 'border-amber-100 bg-amber-50 text-amber-800' : 'border-white/70 bg-white/85 text-slate-600';
  return <p className={`rounded-3xl border p-5 text-sm shadow-sm ${toneClassName}`}>{children}</p>;
}
```

- [ ] **Step 4: Update `frontend/src/styles.css`**

Replace the file with:

```css
@import "tailwindcss";

:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-width: 320px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.16), transparent 34rem),
    radial-gradient(circle at top right, rgba(124, 58, 237, 0.14), transparent 30rem),
    linear-gradient(180deg, #f8fbff 0%, #f8fafc 42%, #eef4ff 100%);
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body::before {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  content: "";
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, black, transparent 72%);
}

button,
input,
textarea {
  font: inherit;
}
```

- [ ] **Step 5: Update `frontend/src/components/Layout.tsx`**

Replace the file with:

```tsx
import { Link, NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/tools', label: '工具库' },
  { to: '/workflows', label: '工作流' },
  { to: '/guides', label: '使用指南' },
  { to: '/updates', label: '更新日志' },
  { to: '/login', label: '后台登录' },
];

export function Layout() {
  return (
    <div className="min-h-screen" data-testid="saas-page-shell">
      <header className="sticky top-0 z-50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-lg shadow-slate-200/60 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-3 text-sm font-black tracking-tight text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-blue-500/20">FM</span>
            <span className="hidden sm:inline">FM AI Tools Hub</span>
          </Link>
          <nav className="flex flex-wrap justify-end gap-1 text-sm" aria-label="主导航">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 font-bold transition ${isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Run green checks for shell and primitives**

Run:

```bash
npm --prefix frontend run build
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse imported public tool details"
```

Expected: build succeeds and the E2E test passes.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add frontend/src/components/ui.tsx frontend/src/styles.css frontend/src/components/Layout.tsx frontend/e2e/toolvault.spec.ts
git commit -m "feat: add ToolVault SaaS UI primitives"
```

---

## Task 2: Redesign the home page

**Files:**
- Modify: `frontend/src/pages/HomePage.tsx`
- Test: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Write failing E2E assertions for the SaaS landing page**

In `frontend/e2e/toolvault.spec.ts`, inside `public users can browse workflow, prompt, and command tabs`, after `await page.goto('/');`, add:

```ts
await expect(page.getByText('AI 工具工作台')).toBeVisible();
await expect(page.getByText('内容来源与安全边界')).toBeVisible();
```

The beginning of the test should include:

```ts
await page.goto('/');
await expect(page.getByRole('heading', { name: 'FM AI Tools Hub' })).toBeVisible();
await expect(page.getByText('AI 工具工作台')).toBeVisible();
await expect(page.getByText('内容来源与安全边界')).toBeVisible();
```

- [ ] **Step 2: Run the failing E2E check**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse workflow, prompt, and command tabs"
```

Expected: FAIL because the new SaaS landing text is not present yet.

- [ ] **Step 3: Replace `frontend/src/pages/HomePage.tsx` with the SaaS landing implementation**

Use this content:

```tsx
import { Link } from 'react-router-dom';
import { usePageContent, type PageContentStatus } from '../api/usePageContent';
import { ToolRefLink } from '../components/ToolRefLink';
import { GradientButton, PageHero, SecondaryButton, SectionHeader, StateSurface, SurfaceCard, TextLink } from '../components/ui';

const navigationCards = [
  {
    number: '01',
    title: '推荐组合工作流',
    description: '按“需求、PR、Bug、回归”组织工具组合，直接告诉你该先用什么、再验证什么。',
    link: '/workflows',
    linkText: '打开工作流',
  },
  {
    number: '02',
    title: '测试提示词模板',
    description: '沉淀生成测试用例、冒烟测试、失败分析和测试结论的可复制提示词。',
    link: '/workflows?tab=prompts',
    linkText: '查看提示词',
  },
  {
    number: '03',
    title: '快速命令汇总',
    description: '集中查看 MCP、OpenSpec、uv、Spec Kit、Claude Code 插件和 PicGo 的常用命令。',
    link: '/workflows?tab=commands',
    linkText: '查看速查',
  },
  {
    number: '04',
    title: '工具使用导航',
    description: '说明 MCP 怎么用、该选哪个工具、不同作用域有什么区别，以及必须遵守的安全边界。',
    link: '/guides',
    linkText: '查看指南',
  },
  {
    number: '05',
    title: '工具库详情',
    description: '查看每个工具安装后怎么用、适合做什么、常见提示词、组合用法和安全边界。',
    link: '/tools',
    linkText: '浏览工具库',
  },
  {
    number: '06',
    title: '更新日志',
    description: '查看每日内容更新的来源、更新时间、影响范围、验证结果和安全检查状态。',
    link: '/updates',
    linkText: '查看日志',
  },
];

function HighlightStatus({ status }: { status: PageContentStatus }) {
  if (status === 'loading') {
    return <StateSurface>正在加载每日推荐内容...</StateSurface>;
  }

  if (status === 'error') {
    return <StateSurface tone="amber">每日推荐内容加载失败，请稍后重试。</StateSurface>;
  }

  return null;
}

export function HomePage() {
  const { pageContent, status } = usePageContent();
  const highlights = pageContent.home_highlights;

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="AI 工具工作台"
        title="FM AI Tools Hub"
        description="把 Claude Code MCP、插件、skills、CLI 工具、桌面应用和数据库工具组织成可追踪、可验证、可复用的 AI 工程工具中心。"
        actions={
          <>
            <GradientButton to="/tools">浏览工具库</GradientButton>
            <SecondaryButton to="/workflows">查看工作流</SecondaryButton>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {['公开工具资料', '字段级更新日志', '敏感扫描边界'].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-bold text-slate-100 backdrop-blur">
              {item}
            </div>
          ))}
        </div>
      </PageHero>

      <section>
        <SectionHeader
          eyebrow="Daily Intelligence"
          title="今日推荐能力矩阵"
          description="每天围绕当前工具库刷新可用组合、提示词和命令入口，优先展示能直接转化为操作的内容。"
        />
        <HighlightStatus status={status} />
        {status === 'ready' && highlights.length === 0 && <StateSurface>暂无每日推荐内容。</StateSurface>}
        {status === 'ready' && highlights.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((highlight, index) => (
              <SurfaceCard key={highlight.title} className="p-5" interactive accent={index % 2 === 0 ? 'blue' : 'violet'}>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Signal {index + 1}</p>
                <h2 className="mt-3 text-lg font-black text-slate-950">{highlight.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{highlight.description}</p>
                {highlight.tools.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {highlight.tools.map((tool) => (
                      <ToolRefLink
                        key={`${highlight.title}-${tool.slug || tool.name}`}
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100"
                        tool={tool}
                      />
                    ))}
                  </div>
                )}
              </SurfaceCard>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          eyebrow="Product Map"
          title="从工具发现到验证复盘的一站式入口"
          description="保留现有功能路径，但把入口组织成更像 SaaS 产品能力模块的 feature grid。"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navigationCards.map((card) => (
            <SurfaceCard key={card.title} className="p-6" interactive>
              <p className="text-xs font-black text-blue-700">{card.number}</p>
              <h2 className="mt-3 text-xl font-black text-slate-950">{card.title}</h2>
              <p className="mt-3 min-h-20 text-sm leading-7 text-slate-600">{card.description}</p>
              <TextLink className="mt-5" to={card.link}>{card.linkText}</TextLink>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <SurfaceCard className="p-6" accent="emerald">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Governance</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">内容来源与安全边界</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">公开资料、授权资料和本机扫描摘要进入工具库；更新日志记录来源、变更、验证和敏感扫描结果。</p>
          </div>
          <Link className="text-sm font-black text-emerald-700 hover:text-emerald-900" to="/updates">查看更新日志 →</Link>
        </div>
      </SurfaceCard>
    </div>
  );
}
```

- [ ] **Step 4: Run home page checks**

Run:

```bash
npm --prefix frontend run build
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse workflow, prompt, and command tabs"
```

Expected: build succeeds and the E2E test passes.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add frontend/src/pages/HomePage.tsx frontend/e2e/toolvault.spec.ts
git commit -m "feat: redesign ToolVault home page"
```

---

## Task 3: Redesign the tool library page

**Files:**
- Modify: `frontend/src/pages/ToolListPage.tsx`
- Test: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Write failing E2E assertions for the app directory treatment**

In `public users can filter tools by type radio buttons`, after `await page.goto('/tools');`, add:

```ts
await expect(page.getByText('AI Tools Directory')).toBeVisible();
await expect(page.getByText('搜索与筛选')).toBeVisible();
await expect(page.getByRole('link', { name: /Playwright MCP/ }).getByText('查看指南')).toBeVisible();
```

The beginning should include:

```ts
await page.goto('/tools');
await expect(page.getByText('AI Tools Directory')).toBeVisible();
await expect(page.getByText('搜索与筛选')).toBeVisible();
await expect(page.getByRole('heading', { name: 'Playwright MCP' })).toBeVisible();
await expect(page.getByRole('heading', { name: 'uv' })).toBeVisible();
await expect(page.getByRole('link', { name: /Playwright MCP/ }).getByText('查看指南')).toBeVisible();
```

- [ ] **Step 2: Run the failing tool list E2E check**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can filter tools by type radio buttons"
```

Expected: FAIL because `AI Tools Directory`, `搜索与筛选`, and `查看指南` are not in the current tool list UI.

- [ ] **Step 3: Replace `frontend/src/pages/ToolListPage.tsx`**

Use this content:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet } from '../api/client';
import { PageHero, Pill, SectionHeader, StateSurface, SurfaceCard, TextLink } from '../components/ui';

type ToolListStatus = 'loading' | 'error' | 'ready';

function statusTone(status: string) {
  if (status === 'installed' || status === 'configured') return 'emerald';
  if (status === 'draft') return 'amber';
  return 'blue';
}

export function ToolListPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [status, setStatus] = useState<ToolListStatus>('loading');

  const toolTypes = useMemo(() => {
    const typeCounts = new Map<string, number>();

    tools.forEach((tool) => {
      typeCounts.set(tool.type, (typeCounts.get(tool.type) ?? 0) + 1);
    });

    return Array.from(typeCounts, ([type, count]) => ({ type, count })).sort((left, right) =>
      left.type.localeCompare(right.type),
    );
  }, [tools]);

  const filteredTools = selectedType ? tools.filter((tool) => tool.type === selectedType) : tools;

  useEffect(() => {
    let isActive = true;
    const path = query ? `/api/tools?q=${encodeURIComponent(query)}` : '/api/tools';

    setStatus('loading');

    apiGet<Tool[]>(path)
      .then((loadedTools) => {
        if (!isActive) return;
        setTools(loadedTools);
        setStatus('ready');
      })
      .catch(() => {
        if (!isActive) return;
        setTools([]);
        setStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, [query]);

  useEffect(() => {
    if (selectedType && !toolTypes.some((toolType) => toolType.type === selectedType)) {
      setSelectedType('');
    }
  }, [selectedType, toolTypes]);

  return (
    <div className="space-y-8">
      <PageHero
        eyebrow="AI Tools Directory"
        title="工具库"
        description="像浏览 SaaS 集成市场一样查看本机和公开 AI 工程工具：先按类型筛选，再进入详情页查看安装后怎么用、适合做什么和安全边界。"
        variant="light"
      />

      <SurfaceCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <SectionHeader eyebrow="Filter" title="搜索与筛选" description="默认展示全部公开工具，可按工具标识或关键词快速定位。" />
            <input
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-inner outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 lg:max-w-md"
              placeholder="搜索工具"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          {toolTypes.length > 0 && (
            <fieldset aria-label="工具标识筛选" className="lg:max-w-2xl">
              <legend className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">按标识筛选</legend>
              <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2">
                <label className={`group flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black transition ${selectedType === '' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}>
                  <input type="radio" name="tool-type-filter" value="" checked={selectedType === ''} onChange={() => setSelectedType('')} className="sr-only" />
                  <span>全部</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedType === '' ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>{tools.length}</span>
                </label>
                {toolTypes.map((toolType) => (
                  <label key={toolType.type} className={`group flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black transition ${selectedType === toolType.type ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}>
                    <input type="radio" name="tool-type-filter" value={toolType.type} checked={selectedType === toolType.type} onChange={() => setSelectedType(toolType.type)} className="sr-only" />
                    <span>{toolType.type}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedType === toolType.type ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>{toolType.count}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </SurfaceCard>

      {status === 'loading' && <StateSurface>正在加载工具...</StateSurface>}
      {status === 'error' && <StateSurface tone="red">工具加载失败，请稍后重试。</StateSurface>}
      {status === 'ready' && filteredTools.length === 0 && <StateSurface>暂无匹配工具。</StateSurface>}
      {status === 'ready' && filteredTools.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTools.map((tool) => (
            <Link key={tool.slug} to={`/tools/${tool.slug}`} className="group block">
              <SurfaceCard className="flex h-full flex-col p-5" interactive accent="blue">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-950 group-hover:text-blue-700">{tool.name}</h2>
                  <Pill tone="blue">{tool.type}</Pill>
                </div>
                <Pill tone={statusTone(tool.status)} className="mt-4 w-fit">{tool.status}</Pill>
                <p className="mt-4 line-clamp-5 flex-1 text-sm leading-7 text-slate-600">{tool.summary}</p>
                <TextLink className="mt-5" to={`/tools/${tool.slug}`}>查看指南</TextLink>
              </SurfaceCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tool list checks**

Run:

```bash
npm --prefix frontend run build
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can filter tools by type radio buttons"
```

Expected: build succeeds and the E2E test passes. Existing assertions that tags are not shown must continue passing.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add frontend/src/pages/ToolListPage.tsx frontend/e2e/toolvault.spec.ts
git commit -m "feat: redesign tool library directory"
```

---

## Task 4: Redesign tool detail pages

**Files:**
- Modify: `frontend/src/pages/ToolDetailPage.tsx`
- Test: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Write failing E2E assertion for product-detail framing**

In `public users can browse imported public tool details`, after the URL assertion for `/tools/playwright-mcp`, add:

```ts
await expect(page.getByText('Tool Profile')).toBeVisible();
await expect(page.getByText('命令与验证')).toBeVisible();
```

The relevant block should become:

```ts
await page.getByRole('link', { name: /Playwright MCP/ }).click();
await expect(page).toHaveURL(/\/tools\/playwright-mcp$/);
await expect(page.getByText('Tool Profile')).toBeVisible();
await expect(page.getByText('命令与验证')).toBeVisible();
await expect(page.getByRole('heading', { name: 'Playwright MCP', exact: true })).toBeVisible();
```

- [ ] **Step 2: Run the failing detail E2E check**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse imported public tool details"
```

Expected: FAIL because `Tool Profile` and `命令与验证` are not shown in the current detail page.

- [ ] **Step 3: Update imports in `frontend/src/pages/ToolDetailPage.tsx`**

Change the imports from:

```tsx
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Guide, Tool, apiGet } from '../api/client';
```

to:

```tsx
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Guide, Tool, apiGet } from '../api/client';
import { CommandBlock, PageHero, Pill, SectionHeader, StateSurface, SurfaceCard } from '../components/ui';
```

- [ ] **Step 4: Restyle loading, error, and not-found states**

Replace:

```tsx
if (status === 'loading') {
  return <p className="text-slate-600">正在加载工具...</p>;
}

if (status === 'error') {
  return <p className="text-slate-600">工具加载失败，请稍后重试。</p>;
}

if (status === 'not-found' || !tool) {
  return <p className="text-slate-600">未找到公开工具。</p>;
}
```

with:

```tsx
if (status === 'loading') {
  return <StateSurface>正在加载工具...</StateSurface>;
}

if (status === 'error') {
  return <StateSurface tone="red">工具加载失败，请稍后重试。</StateSurface>;
}

if (status === 'not-found' || !tool) {
  return <StateSurface>未找到公开工具。</StateSurface>;
}
```

- [ ] **Step 5: Replace the main returned JSX**

Inside `return (...)`, replace the current `<article className="space-y-8">...</article>` with:

```tsx
<article className="space-y-8">
  <PageHero
    eyebrow="Tool Profile"
    title={tool.name}
    description={tool.summary}
    variant="gradient"
    actions={
      <div className="flex flex-wrap gap-2">
        <Pill tone="blue" className="bg-white/10 text-blue-100 ring-white/15">{tool.type}</Pill>
        <Pill tone="emerald" className="bg-emerald-400/15 text-emerald-100 ring-emerald-300/20">{tool.status}</Pill>
      </div>
    }
  >
    {tool.tags.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {tool.tags.map((tag) => (
          <span key={tag.slug} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-100 ring-1 ring-white/10">#{tag.name}</span>
        ))}
      </div>
    )}
  </PageHero>

  {(tool.install_command || tool.verify_command) && (
    <SurfaceCard className="p-6" accent="blue">
      <SectionHeader eyebrow="Commands" title="命令与验证" description="保留安装、检查和本地验证命令，方便从详情页直接复制使用。" />
      <div className="grid gap-4 lg:grid-cols-2">
        {tool.install_command && <CommandBlock label="安装命令" command={tool.install_command} />}
        {tool.verify_command && <CommandBlock label="验证命令" command={tool.verify_command} />}
      </div>
    </SurfaceCard>
  )}

  <div className={`grid gap-8 ${headings.length > 0 ? 'lg:grid-cols-[18rem_minmax(0,1fr)]' : ''}`}>
    {headings.length > 0 && (
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <nav aria-label="指南目录" className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur">
          <p className="text-sm font-black text-slate-950">指南目录</p>
          <div className="mt-4 space-y-1">
            {headings.map((heading) => (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className={`block rounded-xl px-3 py-2 text-sm leading-5 transition hover:bg-blue-50 hover:text-blue-700 ${
                  heading.depth === 1
                    ? 'font-bold text-slate-900'
                    : heading.depth === 2
                      ? 'ml-3 text-slate-600'
                      : 'ml-6 text-slate-500'
                }`}
              >
                {heading.text}
              </a>
            ))}
          </div>
        </nav>
      </aside>
    )}

    <div className="space-y-6">
      {tool.guides.map((guide) => (
        <SurfaceCard key={guide.id} className="p-6 md:p-8" accent="violet">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">{guide.guide_type}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{guide.title}</h2>
            </div>
            <Pill>{guide.visibility}</Pill>
          </div>
          <div className="space-y-6">
            <GuideMarkdown guide={guide} headings={headings} toolName={tool.name} />
          </div>
        </SurfaceCard>
      ))}
    </div>
  </div>
</article>
```

- [ ] **Step 6: Run detail page checks**

Run:

```bash
npm --prefix frontend run build
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse imported public tool details"
```

Expected: build succeeds and E2E passes. Existing guide table and guide directory assertions must remain green.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
git add frontend/src/pages/ToolDetailPage.tsx frontend/e2e/toolvault.spec.ts
git commit -m "feat: redesign tool detail pages"
```

---

## Task 5: Redesign workflow tabs page

**Files:**
- Modify: `frontend/src/pages/WorkflowPage.tsx`
- Test: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Write failing E2E assertion for solution-page framing**

In `public users can browse workflow, prompt, and command tabs`, after navigating to workflows and after `await expect(page).toHaveURL(/\/workflows$/);`, add:

```ts
await expect(page.getByText('Solution Library')).toBeVisible();
await expect(page.getByText('从任务到验证结果')).toBeVisible();
```

- [ ] **Step 2: Run the failing workflow E2E check**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse workflow, prompt, and command tabs"
```

Expected: FAIL because `Solution Library` and `从任务到验证结果` are not rendered yet.

- [ ] **Step 3: Update imports in `frontend/src/pages/WorkflowPage.tsx`**

Change imports from:

```tsx
import { useSearchParams } from 'react-router-dom';
import { usePageContent } from '../api/usePageContent';
import { ToolRefPillLink } from '../components/ToolRefLink';
```

to:

```tsx
import { useSearchParams } from 'react-router-dom';
import { usePageContent } from '../api/usePageContent';
import { ToolRefPillLink } from '../components/ToolRefLink';
import { CommandBlock, PageHero, SectionHeader, SegmentedTabs, StateSurface, SurfaceCard } from '../components/ui';
```

- [ ] **Step 4: Replace the hero and tab selector JSX**

Replace the opening section and tab section:

```tsx
<section className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
  ...
</section>
...
<section className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
  ...
</section>
```

with:

```tsx
<PageHero
  eyebrow="Solution Library"
  title="实用工作流"
  description="从任务到验证结果，把工具、提示词和命令组织成可执行路线。单个工具的深度指南仍在工具详情页，这里负责组合、导航和速查。"
  variant="gradient"
/>

{status === 'loading' && <StateSurface>正在加载每日工作流内容...</StateSurface>}
{status === 'error' && <StateSurface tone="red">每日工作流内容加载失败，请稍后重试。</StateSurface>}

{status === 'ready' && (
  <>
    <SegmentedTabs tabs={tabs} activeTab={activeTab} onSelect={selectTab} ariaLabel="工作流内容分类" idPrefix="workflow" />
```

Also change the tab panel ids and labels to match the shared component ids:

```tsx
<div id="workflow-workflows-panel" role="tabpanel" aria-labelledby="workflow-workflows-tab" className="space-y-8">
```

```tsx
<div id="workflow-prompts-panel" role="tabpanel" aria-labelledby="workflow-prompts-tab" className="space-y-6">
```

```tsx
<div id="workflow-commands-panel" role="tabpanel" aria-labelledby="workflow-commands-tab" className="space-y-6">
```

- [ ] **Step 5: Wrap workflow content cards with `SurfaceCard` and `SectionHeader`**

For the workflow tab, replace section headings such as:

```tsx
<section>
  <div className="mb-4 flex items-end justify-between gap-4">
```

with:

```tsx
<section>
  <SectionHeader eyebrow="Workflow" title="推荐组合工作流" description="按场景组织工具组合、执行步骤和验收方式。" />
```

Wrap individual workflow/tool combination/prompt/command cards by replacing `className="rounded-2xl bg-white ..."` containers with:

```tsx
<SurfaceCard key={...} className="p-5" interactive>
  ...existing card content...
</SurfaceCard>
```

For command strings, replace raw `pre` command blocks with:

```tsx
<CommandBlock key={command} command={command} />
```

Do not change the text content, tool links, or conditional rendering logic.

- [ ] **Step 6: Run workflow checks**

Run:

```bash
npm --prefix frontend run build
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse workflow, prompt, and command tabs|public users can browse guide page and legacy workflow redirects"
```

Expected: build succeeds and both E2E tests pass. `aria-selected` assertions must remain green.

- [ ] **Step 7: Commit Task 5**

Run:

```bash
git add frontend/src/pages/WorkflowPage.tsx frontend/e2e/toolvault.spec.ts
git commit -m "feat: redesign workflow solution page"
```

---

## Task 6: Redesign guide navigation page

**Files:**
- Modify: `frontend/src/pages/GuideNavigationPage.tsx`
- Test: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Write failing E2E assertion for onboarding-guide framing**

In `public users can browse guide page and legacy workflow redirects`, after `await expect(page).toHaveURL(/\/guides$/);`, add:

```ts
await expect(page.getByText('Getting Started')).toBeVisible();
await expect(page.getByText('选择工具的决策指南')).toBeVisible();
```

- [ ] **Step 2: Run the failing guide E2E check**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse guide page and legacy workflow redirects"
```

Expected: FAIL because the new guide framing text is not present yet.

- [ ] **Step 3: Update imports in `frontend/src/pages/GuideNavigationPage.tsx`**

Add the shared UI import:

```tsx
import { CommandBlock, PageHero, SectionHeader, StateSurface, SurfaceCard } from '../components/ui';
```

Keep existing imports for `usePageContent` and `ToolRefLink`.

- [ ] **Step 4: Replace the top hero**

Replace:

```tsx
<section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
  <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Guide Navigation</p>
  <h1 className="mt-3 text-3xl font-bold text-slate-950">工具使用导航</h1>
  <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-600">
    这里放“怎么选工具、怎么开始、什么不能做”的导航性说明；具体工具的完整指南仍在工具详情页。
  </p>
</section>
```

with:

```tsx
<PageHero
  eyebrow="Getting Started"
  title="工具使用导航"
  description="选择工具的决策指南：先理解 MCP、CLI、plugin、desktop app 和 skill 的使用方式，再按任务场景进入具体工具详情页。"
  variant="light"
/>
```

- [ ] **Step 5: Restyle guide cards**

Replace each top-level white guide article container:

```tsx
<article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
```

with:

```tsx
<SurfaceCard className="p-6" accent="blue">
```

and close it with `</SurfaceCard>` instead of `</article>`.

Replace raw example `pre` blocks:

```tsx
<pre key={example} className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><code>{example}</code></pre>
```

with:

```tsx
<CommandBlock key={example} command={example} />
```

For loading and error states, replace plain paragraphs with:

```tsx
{status === 'loading' && <StateSurface>正在加载每日导航内容...</StateSurface>}
{status === 'error' && <StateSurface tone="red">每日导航内容加载失败，请稍后重试。</StateSurface>}
```

Preserve the visible heading `安全注意事项` because existing E2E expects it.

- [ ] **Step 6: Run guide checks**

Run:

```bash
npm --prefix frontend run build
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse guide page and legacy workflow redirects"
```

Expected: build succeeds and the guide E2E test passes.

- [ ] **Step 7: Commit Task 6**

Run:

```bash
git add frontend/src/pages/GuideNavigationPage.tsx frontend/e2e/toolvault.spec.ts
git commit -m "feat: redesign guide navigation page"
```

---

## Task 7: Redesign update logs as release notes

**Files:**
- Modify: `frontend/src/pages/UpdateLogPage.tsx`
- Test: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Write failing E2E assertion for audit-trail framing**

In `public users can browse update logs`, after `await expect(page).toHaveURL(/\/updates$/);`, add:

```ts
await expect(page.getByText('Release Notes')).toBeVisible();
await expect(page.getByText('可追踪的内容审计轨迹')).toBeVisible();
```

- [ ] **Step 2: Run failing update-log E2E check**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse update logs"
```

Expected: FAIL because the new release-note framing text is not present yet.

- [ ] **Step 3: Update imports in `frontend/src/pages/UpdateLogPage.tsx`**

Add:

```tsx
import { MetricCard, PageHero, SegmentedTabs, StateSurface, SurfaceCard } from '../components/ui';
```

Keep existing imports and helper functions.

- [ ] **Step 4: Replace update-log hero and state paragraphs**

Replace the top hero section with:

```tsx
<PageHero
  eyebrow="Release Notes"
  title="更新日志"
  description="可追踪的内容审计轨迹：记录来源、北京时间、影响范围、验证结果、敏感扫描摘要和字段级变更。"
  variant="dark"
/>
```

Replace loading/error/empty paragraphs with:

```tsx
{status === 'loading' && <StateSurface>正在加载更新日志...</StateSurface>}
{status === 'error' && <StateSurface tone="red">更新日志加载失败，请稍后重试。</StateSurface>}
{status === 'ready' && logs.length === 0 && <StateSurface>暂无更新记录。</StateSurface>}
```

- [ ] **Step 5: Replace metric cards**

Replace the three inline summary `<article>` cards with:

```tsx
<section className="grid gap-4 md:grid-cols-3">
  <MetricCard label="最近更新时间" value={formatBeijingTime(latest.update_time)} />
  <MetricCard label="日志总数" value={logs.length} />
  <MetricCard label="验证结果" value={`通过 ${successfulCount} / 失败 ${failedCount}`} />
</section>
```

- [ ] **Step 6: Restyle log articles and internal tabs**

Inside `UpdateLogArticle`, replace the outer article class:

```tsx
<article aria-label={`更新日志 ${logTime}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
```

with:

```tsx
<SurfaceCard className="p-5" accent={log.status === 'failed' ? 'violet' : 'blue'}>
  <article aria-label={`更新日志 ${logTime}`}>
```

and close both tags at the end:

```tsx
  </article>
</SurfaceCard>
```

Inside `ExecutionDetails`, replace the custom tab button block with shared `SegmentedTabs`:

```tsx
<SegmentedTabs
  tabs={[
    { key: 'report', label: '执行结果报告' },
    { key: 'changes', label: '具体更新内容' },
  ]}
  activeTab={activeTab}
  onSelect={setActiveTab}
  ariaLabel="执行详情分类"
  idPrefix="execution"
/>
```

Update panel ids to:

```tsx
<div id="execution-report-panel" role="tabpanel" aria-labelledby="execution-report-tab">
```

and:

```tsx
<div id="execution-changes-panel" role="tabpanel" aria-labelledby="execution-changes-tab">
```

If existing E2E expects tabs by visible name and `aria-selected`, it should continue to pass.

- [ ] **Step 7: Run update-log checks**

Run:

```bash
npm --prefix frontend run build
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "public users can browse update logs"
```

Expected: build succeeds and the update-log E2E test passes. Existing compact overview, hidden content-plan checklist, report chips, and page-path link assertions remain green.

- [ ] **Step 8: Commit Task 7**

Run:

```bash
git add frontend/src/pages/UpdateLogPage.tsx frontend/e2e/toolvault.spec.ts
git commit -m "feat: redesign update logs audit trail"
```

---

## Task 8: Redesign login and admin pages

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/pages/admin/AdminToolsPage.tsx`
- Modify: `frontend/src/pages/admin/ImportPage.tsx`
- Test: `frontend/e2e/toolvault.spec.ts`

- [ ] **Step 1: Write failing E2E assertions for admin SaaS styling**

In `admin can log in and re-import reviewed JSON`, after `await login(page);`, add:

```ts
await expect(page.getByText('Admin Console')).toBeVisible();
```

In the `login` helper, after `await page.goto('/login');`, add:

```ts
await expect(page.getByText('Secure Admin')).toBeVisible();
```

- [ ] **Step 2: Run failing admin E2E check**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "admin can log in and re-import reviewed JSON"
```

Expected: FAIL because `Secure Admin` and `Admin Console` are not rendered yet.

- [ ] **Step 3: Replace `frontend/src/pages/LoginPage.tsx`**

Use this content:

```tsx
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, storeToken } from '../api/client';
import { PageHero, SurfaceCard } from '../components/ui';

type LoginStatus = 'idle' | 'submitting';

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<LoginStatus>('idle');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('submitting');
    try {
      const response = await login(username, password);
      storeToken(response.access_token);
      navigate('/admin/tools');
    } catch {
      setError('用户名或密码错误，请检查后重试。');
      setStatus('idle');
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_28rem] lg:items-center">
      <PageHero
        eyebrow="Secure Admin"
        title="后台登录"
        description="进入后台后可以查看登录可见工具，并导入经过审阅的 Claude JSON。"
        variant="dark"
      />
      <SurfaceCard className="p-7">
        <form onSubmit={onSubmit}>
          <h1 className="text-2xl font-black text-slate-950">后台登录</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">登录后可查看内部工具并导入 Claude JSON。</p>
          <label className="mt-6 block text-sm font-bold text-slate-700" htmlFor="admin-username">用户名</label>
          <input id="admin-username" autoComplete="username" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" value={username} onChange={(event) => setUsername(event.target.value)} />
          <label className="mt-4 block text-sm font-bold text-slate-700" htmlFor="admin-password">密码</label>
          <input id="admin-password" autoComplete="current-password" className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <button className="mt-6 min-h-12 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 font-black text-white shadow-lg shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? '正在登录...' : '登录'}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
```

- [ ] **Step 4: Replace `frontend/src/pages/admin/AdminToolsPage.tsx`**

Use this content:

```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet, getStoredToken } from '../../api/client';
import { GradientButton, PageHero, Pill, StateSurface, SurfaceCard } from '../../components/ui';

type AdminToolsStatus = 'loading' | 'error' | 'unauthenticated' | 'ready';

export function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [status, setStatus] = useState<AdminToolsStatus>('loading');

  useEffect(() => {
    let isActive = true;
    const token = getStoredToken();

    if (!token) {
      setTools([]);
      setStatus('unauthenticated');
      return () => {
        isActive = false;
      };
    }

    setStatus('loading');

    apiGet<Tool[]>('/api/admin/tools', token)
      .then((loadedTools) => {
        if (!isActive) return;
        setTools(loadedTools);
        setStatus('ready');
      })
      .catch(() => {
        if (!isActive) return;
        setTools([]);
        setStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Admin Console" title="后台工具管理" description="查看公开和登录可见的工具条目，并进入导入流程刷新工具库内容。" variant="light" actions={<GradientButton to="/admin/imports">导入 JSON</GradientButton>} />
      {status === 'loading' && <StateSurface>正在加载后台工具...</StateSurface>}
      {status === 'unauthenticated' && (
        <SurfaceCard className="p-6">
          <p className="text-slate-700">请先登录后台，再查看工具管理列表。</p>
          <GradientButton className="mt-4" to="/login">前往登录</GradientButton>
        </SurfaceCard>
      )}
      {status === 'error' && <StateSurface tone="red">后台工具加载失败，请检查登录状态后重试。</StateSurface>}
      {status === 'ready' && tools.length === 0 && <StateSurface>暂无工具，可先导入 Claude JSON。</StateSurface>}
      {status === 'ready' && tools.length > 0 && (
        <SurfaceCard>
          {tools.map((tool) => (
            <div key={tool.slug} className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-slate-950">{tool.name}</p>
                <p className="mt-1 text-sm text-slate-500">{tool.type} · {tool.visibility}</p>
              </div>
              <Pill tone="blue">{tool.status}</Pill>
            </div>
          ))}
        </SurfaceCard>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Replace `frontend/src/pages/admin/ImportPage.tsx`**

Use this content:

```tsx
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost, getStoredToken } from '../../api/client';
import { GradientButton, PageHero, SurfaceCard } from '../../components/ui';

type ImportStatus = 'idle' | 'submitting' | 'success' | 'error' | 'unauthenticated';

type ImportResult = {
  created: number;
  updated: number;
  import_id: number;
};

export function ImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    const token = getStoredToken();
    if (!token) {
      setStatus('unauthenticated');
      setMessage('请先登录后台，再执行导入。');
      return;
    }

    if (!jsonText.trim()) {
      setStatus('error');
      setMessage('请先粘贴需要导入的 JSON。');
      return;
    }

    setStatus('submitting');
    try {
      const payload = JSON.parse(jsonText) as unknown;
      const result = await apiPost<ImportResult>('/api/admin/imports/tools', payload, token);
      setStatus('success');
      setMessage(`导入成功：新增 ${result.created}，更新 ${result.updated}`);
    } catch {
      setStatus('error');
      setMessage('导入失败，请检查 JSON、登录状态或敏感信息提示。');
    }
  }

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Admin Console" title="Claude JSON 导入" description="粘贴 Claude 生成并审阅过的导入 JSON，导入前仍需确认不包含真实密钥或敏感内容。" variant="light" actions={<GradientButton to="/admin/tools">返回工具管理</GradientButton>} />
      <SurfaceCard className="p-6">
        <form onSubmit={onSubmit}>
          <label className="block text-sm font-black text-slate-700" htmlFor="import-json">导入 JSON</label>
          <textarea id="import-json" className="mt-3 min-h-96 w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm leading-7 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100" value={jsonText} onChange={(event) => setJsonText(event.target.value)} />
          {message && (
            <p className={status === 'error' || status === 'unauthenticated' ? 'mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700' : 'mt-4 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700'} role={status === 'error' || status === 'unauthenticated' ? 'alert' : 'status'}>
              {message}
            </p>
          )}
          {status === 'unauthenticated' && <Link className="mt-4 inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 py-2 font-black text-slate-700" to="/login">前往登录</Link>}
          <button className="mt-4 min-h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-500/25 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? '正在导入...' : '执行导入'}
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
```

- [ ] **Step 6: Run admin checks**

Run:

```bash
npm --prefix frontend run build
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e -- -g "admin can log in and re-import reviewed JSON|private imported tools stay hidden publicly and visible to admin|invalid import JSON shows an error without leaving the page"
```

Expected: build succeeds and all three admin-related E2E tests pass.

- [ ] **Step 7: Commit Task 8**

Run:

```bash
git add frontend/src/pages/LoginPage.tsx frontend/src/pages/admin/AdminToolsPage.tsx frontend/src/pages/admin/ImportPage.tsx frontend/e2e/toolvault.spec.ts
git commit -m "feat: redesign admin pages"
```

---

## Task 9: Full regression and browser acceptance

**Files:**
- Test: `frontend/e2e/toolvault.spec.ts`
- No production file changes unless a verification failure identifies a specific bug.

- [ ] **Step 1: Run full frontend build**

Run:

```bash
npm --prefix frontend run build
```

Expected: TypeScript and Vite build succeed.

- [ ] **Step 2: Run full frontend E2E suite**

Run:

```bash
PLAYWRIGHT_BASE_URL="http://127.0.0.1:5288" npm --prefix frontend run e2e
```

Expected: all Playwright tests pass.

- [ ] **Step 3: Run backend tests that guard current import/update-log behavior**

Run:

```bash
uv run --directory backend pytest tests/test_import_service.py tests/test_update_log_api.py tests/test_daily_update_cli.py tests/test_dev_port_config.py -q
```

Expected: all targeted backend tests pass. No backend code should have changed during this redesign.

- [ ] **Step 4: Browser acceptance pass**

Use the running app in a browser and inspect these routes:

```text
/
/tools
/tools/playwright-mcp
/workflows
/workflows?tab=prompts
/workflows?tab=commands
/guides
/updates
/login
/admin/tools
/admin/imports
```

Acceptance checks:

```text
- Site feels like one cohesive AI SaaS product.
- Header is floating/sticky and readable.
- Home page looks like a SaaS landing page.
- Tool list looks like an app directory and does not show tag chips.
- Tool detail page still shows command text, guide directory, markdown guide content, and tables.
- Workflow tabs still switch correctly and preserve URLs.
- Update logs still collapse/expand and internal tabs still work.
- Admin login/import flows remain usable.
- Chinese long text does not wrap awkwardly on wide screens.
- Browser console shows no new errors.
```

- [ ] **Step 5: Fix only verified regressions**

If any check fails, write the smallest failing E2E assertion or reproduce the failing existing assertion, then fix only that regression. Do not add new visual scope.

- [ ] **Step 6: Commit final verification fixes if needed**

If Step 5 changed files, run:

```bash
git add frontend/src frontend/e2e/toolvault.spec.ts
git commit -m "fix: polish SaaS redesign regressions"
```

If no files changed, do not create an empty commit.

---

## Self-review checklist

Before starting implementation, verify:

- Every task keeps backend APIs unchanged.
- Every page named in the spec is covered.
- Tool list tags remain hidden.
- `/prompts` and `/commands` remain redirects because `App.tsx` is not changed.
- Update-log compact overview and internal tabs remain covered by E2E.
- Admin import and private visibility tests remain covered.
- Shared components are introduced before page migrations.
- Each implementation task has a failing assertion before production code changes.
- Browser acceptance is required after automated checks.
