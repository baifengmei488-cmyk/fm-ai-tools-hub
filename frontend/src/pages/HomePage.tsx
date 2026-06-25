import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageContent, type PageContentStatus } from '../api/usePageContent';
import { ToolRefLink } from '../components/ToolRefLink';

const navigationCards = [
  { mark: 'WF', title: '推荐组合工作流', description: '按需求、PR、Bug、回归组织工具组合。', link: '/workflows', linkText: '打开工作流', tone: 'from-blue-600 to-cyan-500' },
  { mark: 'PT', title: '场景提示词模板', description: '沉淀资料整理、验证、分析和结论输出。', link: '/workflows?tab=prompts', linkText: '查看提示词', tone: 'from-violet-600 to-fuchsia-500' },
  { mark: 'CMD', title: '快速命令汇总', description: 'MCP、OpenSpec、uv、插件和 PicGo 命令。', link: '/workflows?tab=commands', linkText: '查看速查', tone: 'from-slate-900 to-slate-700' },
  { mark: 'NAV', title: '工具使用导航', description: '说明怎么选工具、怎么用和安全边界。', link: '/guides', linkText: '查看指南', tone: 'from-emerald-600 to-teal-500' },
  { mark: 'LIB', title: '工具库详情', description: '安装后怎么用、适合做什么和组合方式。', link: '/tools', linkText: '浏览工具库', tone: 'from-orange-500 to-amber-400' },
  { mark: 'LOG', title: '更新日志', description: '来源、影响范围、验证和敏感扫描结果。', link: '/updates', linkText: '查看日志', tone: 'from-rose-600 to-pink-500' },
];

function HighlightStatus({ status }: { status: PageContentStatus }) {
  if (status === 'loading') {
    return <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-100">正在加载每日推荐内容...</p>;
  }

  if (status === 'error') {
    return <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-100">每日推荐内容加载失败，请稍后重试。</p>;
  }

  return null;
}

export function HomePage() {
  const { pageContent, status } = usePageContent();
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const wheelLock = useRef(false);
  const wheelUnlockTimer = useRef<number | null>(null);
  const highlights = pageContent.home_highlights;
  const currentHighlightIndex = Math.min(activeHighlightIndex, Math.max(highlights.length - 1, 0));
  const activeHighlight = highlights[currentHighlightIndex];

  useEffect(() => {
    return () => {
      if (wheelUnlockTimer.current !== null) {
        window.clearTimeout(wheelUnlockTimer.current);
      }
    };
  }, []);

  function releaseWheelLockAfterGesture() {
    if (wheelUnlockTimer.current !== null) {
      window.clearTimeout(wheelUnlockTimer.current);
    }
    wheelUnlockTimer.current = window.setTimeout(() => {
      wheelLock.current = false;
      wheelUnlockTimer.current = null;
    }, 650);
  }

  function showNextHighlight() {
    if (highlights.length < 2) {
      return;
    }
    if (wheelLock.current) {
      releaseWheelLockAfterGesture();
      return;
    }
    wheelLock.current = true;
    setActiveHighlightIndex((current) => (current + 1) % highlights.length);
    releaseWheelLockAfterGesture();
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-2xl bg-slate-950 px-5 py-5 text-white shadow-sm ring-1 ring-slate-900/10 md:px-6">
          <p className="text-xs font-black uppercase tracking-wide text-blue-200">AI 工具知识速查系统</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">FM AI Tools Hub</h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-200">
            记录 Claude Code MCP、插件、skills、CLI、桌面应用和数据库工具，并整理为“工具库 + 综合工作流 + 使用指南 + 更新日志”的速查入口。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-500" to="/tools">浏览工具库</Link>
            <Link className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/15" to="/workflows">查看工作流</Link>
          </div>
        </div>

        <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Daily Refresh</p>
              <h2 className="mt-1 text-base font-black text-slate-950">今日推荐</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{status === 'ready' ? `${highlights.length} 条` : '同步中'}</span>
          </div>
          <div className="mt-3 space-y-2">
            <HighlightStatus status={status} />
            {status === 'ready' && highlights.length === 0 && <p className="text-sm text-slate-600">暂无每日推荐内容。</p>}
            {status === 'ready' && activeHighlight && (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch">
                <div
                  aria-label="每日推荐卡片"
                  className="relative min-h-48 overscroll-contain"
                  onWheel={(event) => {
                    if (event.deltaY > 0) {
                      event.preventDefault();
                      showNextHighlight();
                    }
                  }}
                  onTouchStart={(event) => {
                    touchStartY.current = event.touches[0]?.clientY ?? null;
                  }}
                  onTouchEnd={(event) => {
                    const startY = touchStartY.current;
                    const endY = event.changedTouches[0]?.clientY;
                    touchStartY.current = null;
                    if (startY !== null && endY !== undefined && startY - endY > 32) {
                      showNextHighlight();
                    }
                  }}
                >
                  {highlights.length > 1 && (
                    <>
                      <div className="absolute inset-x-4 top-4 h-full rounded-2xl bg-slate-100 ring-1 ring-slate-100" />
                      <div className="absolute inset-x-8 top-8 h-full rounded-2xl bg-slate-50 ring-1 ring-slate-100" />
                    </>
                  )}
                  <article className="relative rounded-2xl bg-slate-50 p-4 shadow-sm ring-1 ring-slate-100">
                    <div className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">{currentHighlightIndex + 1}</span>
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-950">{activeHighlight.title}</h3>
                        <p className="mt-1 line-clamp-4 text-sm leading-6 text-slate-600">{activeHighlight.description}</p>
                      </div>
                    </div>
                    {activeHighlight.tools.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 pl-12">
                        {activeHighlight.tools.slice(0, 4).map((tool) => (
                          <ToolRefLink key={`${activeHighlight.title}-${tool.slug || tool.name}`} className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-100 hover:bg-blue-50 hover:text-blue-700" tool={tool} />
                        ))}
                        {activeHighlight.tools.length > 4 && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-100">+{activeHighlight.tools.length - 4}</span>}
                      </div>
                    )}
                  </article>
                </div>
                {highlights.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 sm:flex-col" aria-label="每日推荐选择">
                    {highlights.map((highlight, index) => {
                      const isActive = index === currentHighlightIndex;
                      return (
                        <button
                          key={highlight.title}
                          type="button"
                          aria-label={`查看第 ${index + 1} 条推荐`}
                          aria-pressed={isActive}
                          className={`h-2.5 rounded-full transition ${isActive ? 'w-7 bg-blue-600 sm:h-7 sm:w-2.5' : 'w-2.5 bg-slate-300 hover:bg-blue-300'}`}
                          onClick={() => setActiveHighlightIndex(index)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Quick Access</p>
            <h2 className="text-base font-black text-slate-950">工具速查入口</h2>
          </div>
          <Link className="text-sm font-bold text-blue-700 hover:text-blue-900" to="/tools">查看全部工具 →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {navigationCards.map((card) => (
            <Link key={card.title} className="group flex gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100 transition hover:bg-white hover:shadow-sm hover:ring-blue-100" to={card.link}>
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-sm font-black text-white shadow-sm`}>{card.mark}</span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-slate-950 group-hover:text-blue-700">{card.title}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">{card.description}</span>
                <span className="mt-1.5 inline-flex text-sm font-bold text-blue-700">{card.linkText} →</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
