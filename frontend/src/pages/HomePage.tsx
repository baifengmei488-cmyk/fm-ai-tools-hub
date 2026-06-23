import { Link } from 'react-router-dom';
import { usePageContent, type PageContentStatus } from '../api/usePageContent';
import { ToolRefLink } from '../components/ToolRefLink';

const navigationCards = [
  {
    title: '推荐组合工作流',
    description: '按“需求、PR、Bug、回归”组织工具组合，直接告诉你该先用什么、再验证什么。',
    link: '/workflows',
    linkText: '打开工作流',
  },
  {
    title: '测试提示词模板',
    description: '沉淀生成测试用例、冒烟测试、失败分析和测试结论的可复制提示词。',
    link: '/prompts',
    linkText: '查看提示词',
  },
  {
    title: '快速命令汇总',
    description: '集中查看 MCP、OpenSpec、uv、Spec Kit、Claude Code 插件和 PicGo 的常用命令。',
    link: '/commands',
    linkText: '查看速查',
  },
  {
    title: '工具使用导航',
    description: '说明 MCP 怎么用、该选哪个工具、不同作用域有什么区别，以及必须遵守的安全边界。',
    link: '/guides',
    linkText: '查看指南',
  },
  {
    title: '工具库详情',
    description: '查看每个工具安装后怎么用、适合做什么、常见提示词、组合用法和安全边界。',
    link: '/tools',
    linkText: '浏览工具库',
  },
  {
    title: '更新日志',
    description: '查看每日内容更新的来源、更新时间、影响范围、验证结果和安全检查状态。',
    link: '/updates',
    linkText: '查看日志',
  },
];

function HighlightStatus({ status }: { status: PageContentStatus }) {
  if (status === 'loading') {
    return <p className="mt-8 rounded-2xl bg-white/10 p-4 text-sm text-slate-200 ring-1 ring-white/10">正在加载每日推荐内容...</p>;
  }

  if (status === 'error') {
    return <p className="mt-8 rounded-2xl bg-amber-400/10 p-4 text-sm text-amber-100 ring-1 ring-amber-200/20">每日推荐内容加载失败，请稍后重试。</p>;
  }

  return null;
}

export function HomePage() {
  const { pageContent, status } = usePageContent();
  const highlights = pageContent.home_highlights;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">开发 / 测试工具知识库</p>
        <h1 className="mt-3 text-4xl font-bold">FM AI Tools Hub</h1>
        <p className="mt-4 max-w-3xl leading-7 text-slate-200">
          记录 Claude Code MCP、插件、skills、CLI 工具、桌面应用和数据库工具，并把桌面指南里的总结性内容整理成“工具库 + 工作流 + 提示词 + 命令速查”的实用入口。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="inline-flex rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-500" to="/tools">
            浏览工具库
          </Link>
          <Link className="inline-flex rounded-lg bg-white/10 px-4 py-2 font-medium text-white ring-1 ring-white/20 transition hover:bg-white/15" to="/workflows">
            查看工作流
          </Link>
        </div>
        <HighlightStatus status={status} />
        {status === 'ready' && highlights.length === 0 && (
          <p className="mt-8 rounded-2xl bg-white/10 p-4 text-sm text-slate-200 ring-1 ring-white/10">暂无每日推荐内容。</p>
        )}
        {status === 'ready' && highlights.length > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((highlight) => (
              <div key={highlight.title} className="rounded-2xl bg-white/10 p-4 text-sm text-slate-100 ring-1 ring-white/10">
                <p className="font-bold text-white">{highlight.title}</p>
                <p className="mt-2 leading-6 text-slate-300">{highlight.description}</p>
                {highlight.tools.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {highlight.tools.map((tool) => (
                      <ToolRefLink
                        key={`${highlight.title}-${tool.slug || tool.name}`}
                        className="rounded-full bg-blue-400/10 px-2.5 py-1 text-xs font-semibold text-blue-100 ring-1 ring-blue-200/20 hover:bg-blue-300/20 hover:text-white"
                        tool={tool}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {navigationCards.map((card) => (
          <article key={card.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-bold text-slate-950">{card.title}</h2>
            <p className="mt-3 min-h-24 text-sm leading-6 text-slate-600">{card.description}</p>
            <Link className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900" to={card.link}>
              {card.linkText}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
