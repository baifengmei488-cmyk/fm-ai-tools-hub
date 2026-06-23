import { usePageContent } from '../api/usePageContent';
import { ToolRefPillLink } from '../components/ToolRefLink';

export function WorkflowPage() {
  const { pageContent, status } = usePageContent();
  const workflows = pageContent.workflows;
  const toolCombos = pageContent.tool_combinations;
  const promptGroups = pageContent.prompt_groups;
  const commandGroups = pageContent.command_groups;
  const safetyNotes = pageContent.guide_safety_notes;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">导航型使用说明</p>
        <h1 className="mt-3 text-3xl font-bold">实用工作流</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">
          把桌面使用指南里的总结性内容整理成“我要做什么 → 推荐用哪些工具 → 可以直接复制什么提示词”。单个工具的深度指南仍在工具详情页，这里负责组合、导航和速查。
        </p>
      </section>

      {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载每日工作流内容...</p>}
      {status === 'error' && <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 shadow-sm ring-1 ring-red-100">每日工作流内容加载失败，请稍后重试。</p>}

      {status === 'ready' && (
        <>
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-blue-700">Workflow</p>
                <h2 className="text-2xl font-bold text-slate-950">推荐组合工作流</h2>
              </div>
            </div>
            {workflows.length === 0 ? (
              <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无推荐工作流。</p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {workflows.map((workflow) => (
                  <article key={workflow.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <h3 className="text-lg font-bold text-slate-950">{workflow.title}</h3>
                    <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-950">{workflow.flow}</p>
                    {workflow.tools.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {workflow.tools.map((tool) => (
                          <ToolRefPillLink key={`${workflow.title}-${tool.slug || tool.name}`} tool={tool} />
                        ))}
                      </div>
                    )}
                    {workflow.prompt && <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code>{workflow.prompt}</code></pre>}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <p className="text-sm font-semibold text-blue-700">Tool Combinations</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">组合使用示例</h2>
            {toolCombos.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无组合示例。</p>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {toolCombos.map((combo) => (
                  <article key={combo.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <h3 className="font-bold text-slate-950">{combo.title}</h3>
                    {combo.tools.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {combo.tools.map((tool) => (
                          <ToolRefPillLink key={`${combo.title}-${tool.slug || tool.name}`} tool={tool} />
                        ))}
                      </div>
                    )}
                    {combo.flow && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{combo.flow}</p>}
                    {combo.prompt && <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-3 text-sm leading-6 text-slate-100"><code>{combo.prompt}</code></pre>}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="prompt-templates">
            <p className="text-sm font-semibold text-blue-700">Prompt Templates</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">测试人员常用提示词模板</h2>
            {promptGroups.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无提示词模板。</p>
            ) : (
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {promptGroups.map((group) => (
                  <article key={group.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                    <h3 className="font-bold text-slate-950">{group.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
                    {group.tools.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {group.tools.map((tool) => (
                          <ToolRefPillLink key={`${group.title}-${tool.slug || tool.name}`} tool={tool} />
                        ))}
                      </div>
                    )}
                    <div className="mt-3 space-y-3">
                      {group.prompts.map((prompt) => (
                        <pre key={prompt} className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><code>{prompt}</code></pre>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article id="commands" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-blue-700">Command Cheatsheet</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">快速命令汇总</h2>
              {commandGroups.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">暂无命令。</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {commandGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="font-semibold text-slate-950">{group.title}</h3>
                      <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-7 text-slate-100"><code>{group.commands.join('\n')}</code></pre>
                    </div>
                  ))}
                </div>
              )}
            </article>
            <article className="rounded-2xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-100">
              <p className="text-sm font-semibold text-amber-700">Safety</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">安全边界</h2>
              {safetyNotes.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-slate-700">暂无安全说明。</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                  {safetyNotes.map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      )}
    </div>
  );
}
