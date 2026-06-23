import { usePageContent } from '../api/usePageContent';
import { ToolRefPillLink } from '../components/ToolRefLink';

export function PromptTemplatePage() {
  const { pageContent, status } = usePageContent();
  const promptGroups = pageContent.prompt_groups;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Prompt Library</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">提示词模板库</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          把桌面指南里分散的常用提示词按任务场景归类，覆盖规格驱动、测试验收、资料研究、UI 设计、技能创建、时间处理、Python 工具和截图素材。
        </p>
      </section>

      {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载每日提示词模板...</p>}
      {status === 'error' && <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 shadow-sm ring-1 ring-red-100">每日提示词模板加载失败，请稍后重试。</p>}
      {status === 'ready' && promptGroups.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无提示词模板。</p>}
      {status === 'ready' && promptGroups.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          {promptGroups.map((group) => (
            <article key={group.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-bold text-slate-950">{group.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
              {group.tools.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.tools.map((tool) => (
                    <ToolRefPillLink key={`${group.title}-${tool.slug || tool.name}`} tool={tool} />
                  ))}
                </div>
              )}
              <div className="mt-4 space-y-3">
                {group.prompts.map((prompt) => (
                  <pre key={prompt} className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><code>{prompt}</code></pre>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
