import { usePageContent } from '../api/usePageContent';
import { ToolRefLink, ToolRefPillLink } from '../components/ToolRefLink';

export function CommandPage() {
  const { pageContent, status } = usePageContent();
  const commandGroups = pageContent.command_groups;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Cheatsheet</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">快速命令汇总</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          把 Claude Code、MCP、OpenSpec、Spec Kit、uv、插件和 PicGo 的常用检查命令集中放在这里，作为日常操作速查。
        </p>
      </section>

      {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载每日命令速查...</p>}
      {status === 'error' && <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 shadow-sm ring-1 ring-red-100">每日命令速查加载失败，请稍后重试。</p>}
      {status === 'ready' && commandGroups.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无命令速查。</p>}
      {status === 'ready' && commandGroups.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          {commandGroups.map((group) => (
            <article key={group.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-bold text-slate-950">
                {group.tools.length === 1 ? <ToolRefLink tool={group.tools[0]} /> : group.title}
              </h2>
              {group.tools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.tools.map((tool) => (
                    <ToolRefPillLink key={`${group.title}-${tool.slug || tool.name}`} tool={tool} />
                  ))}
                </div>
              )}
              <div className="mt-4 space-y-2">
                {group.commands.map((command) => (
                  <pre key={command} className="overflow-x-auto rounded-xl bg-slate-950 p-3 text-sm leading-6 text-slate-100"><code>{command}</code></pre>
                ))}
              </div>
              {group.note && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">{group.note}</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
