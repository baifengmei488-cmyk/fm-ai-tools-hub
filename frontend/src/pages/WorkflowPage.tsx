import { useSearchParams } from 'react-router-dom';
import { usePageContent } from '../api/usePageContent';
import { ToolRefPillLink } from '../components/ToolRefLink';

type WorkflowTab = 'workflows' | 'prompts' | 'commands';

const tabs: Array<{ key: WorkflowTab; label: string; mark: string; description: string }> = [
  { key: 'workflows', label: '工作流', mark: 'WF', description: '组合路线和验证步骤' },
  { key: 'prompts', label: '提示词', mark: 'PT', description: '可直接改写复用' },
  { key: 'commands', label: '命令', mark: 'CMD', description: 'CLI / MCP 速查' },
];

function resolveTab(tab: string | null): WorkflowTab {
  if (tab === 'prompts' || tab === 'commands') {
    return tab;
  }
  return 'workflows';
}

export function WorkflowPage() {
  const { pageContent, status } = usePageContent();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get('tab'));
  const workflows = pageContent.workflows;
  const toolCombos = pageContent.tool_combinations;
  const promptGroups = pageContent.prompt_groups;
  const commandGroups = pageContent.command_groups;
  const safetyNotes = pageContent.guide_safety_notes;

  function selectTab(tab: WorkflowTab) {
    setSearchParams(tab === 'workflows' ? {} : { tab });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-blue-200">Workflow Console</p>
        <h1 className="mt-1 text-2xl font-black">实用工作流</h1>
        <p className="mt-1 max-w-5xl text-sm leading-6 text-slate-200">
          把桌面使用指南里的总结性内容整理成“我要做什么 → 推荐用哪些工具 → 可以直接复制什么提示词”。
        </p>
      </section>

      {status === 'loading' && <p className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载每日工作流内容...</p>}
      {status === 'error' && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 shadow-sm ring-1 ring-red-100">每日工作流内容加载失败，请稍后重试。</p>}

      {status === 'ready' && (
        <>
          <section className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">内容选项卡</p>
                <p className="text-sm font-semibold text-slate-600">点击切换下方内容，仍停留在工作流综合页。</p>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">当前：{tabs.find((tab) => tab.key === activeTab)?.label}</span>
            </div>
            <div className="grid gap-2 rounded-2xl bg-slate-100 p-1.5 md:grid-cols-3" role="tablist" aria-label="工作流内容分类">
              <p className="sr-only">点击切换下方内容</p>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tab.key}-panel`}
                    id={`${tab.key}-tab`}
                    className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      isActive ? 'border-blue-600 bg-white text-blue-700 shadow-sm' : 'border-transparent bg-white/55 text-slate-600 hover:border-blue-200 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                    }`}
                    onClick={() => selectTab(tab.key)}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700'}`}>{tab.mark}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-black">
                        {tab.label}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-700'}`}>
                          {isActive ? '当前栏目' : '点击切换'}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">{tab.description}</span>
                    </span>
                    <span className={`text-sm font-black ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>→</span>
                  </button>
                );
              })}
            </div>
          </section>

          {activeTab === 'workflows' && (
            <div id="workflows-panel" role="tabpanel" aria-labelledby="workflows-tab" className="space-y-4">
              <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">Workflow</p>
                    <h2 className="text-lg font-black text-slate-950">推荐组合工作流</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{workflows.length} 条</span>
                </div>
                {workflows.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">暂无推荐工作流。</p>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {workflows.map((workflow, index) => (
                      <article key={workflow.title} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <div className="flex gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-black text-slate-950">{workflow.title}</h3>
                            <p className="mt-1 text-sm leading-6 text-slate-700">{workflow.flow}</p>
                          </div>
                        </div>
                        {workflow.tools.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 pl-11">
                            {workflow.tools.map((tool) => (
                              <ToolRefPillLink key={`${workflow.title}-${tool.slug || tool.name}`} tool={tool} />
                            ))}
                          </div>
                        )}
                        {workflow.prompt && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-sm leading-6 text-slate-100"><code>{workflow.prompt}</code></pre>}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="mb-3">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">Tool Combinations</p>
                  <h2 className="text-lg font-black text-slate-950">组合使用示例</h2>
                </div>
                {toolCombos.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">暂无组合示例。</p>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {toolCombos.map((combo) => (
                      <article key={combo.title} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <h3 className="text-sm font-black text-slate-950">{combo.title}</h3>
                        {combo.tools.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {combo.tools.map((tool) => (
                              <ToolRefPillLink key={`${combo.title}-${tool.slug || tool.name}`} tool={tool} />
                            ))}
                          </div>
                        )}
                        {combo.flow && <p className="mt-2 text-sm leading-6 text-slate-700">{combo.flow}</p>}
                        {combo.prompt && <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-sm leading-6 text-slate-100"><code>{combo.prompt}</code></pre>}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'prompts' && (
            <section id="prompts-panel" role="tabpanel" aria-labelledby="prompts-tab" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">Prompt Templates</p>
                <h2 className="text-lg font-black text-slate-950">常用场景提示词模板</h2>
              </div>
              {promptGroups.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">暂无提示词模板。</p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {promptGroups.map((group) => (
                    <article key={group.title} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <h3 className="text-sm font-black text-slate-950">{group.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p>
                      {group.tools.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {group.tools.map((tool) => (
                            <ToolRefPillLink key={`${group.title}-${tool.slug || tool.name}`} tool={tool} />
                          ))}
                        </div>
                      )}
                      <div className="mt-2 space-y-2">
                        {group.prompts.map((prompt) => (
                          <pre key={prompt} className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-100"><code>{prompt}</code></pre>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'commands' && (
            <div id="commands-panel" role="tabpanel" aria-labelledby="commands-tab" className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs font-black uppercase tracking-wide text-blue-700">Command Cheatsheet</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">快速命令汇总</h2>
                {commandGroups.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">暂无命令。</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {commandGroups.map((group) => (
                      <div key={group.title} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <h3 className="text-sm font-black text-slate-950">{group.title}</h3>
                        {group.tools.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {group.tools.map((tool) => (
                              <ToolRefPillLink key={`${group.title}-${tool.slug || tool.name}`} tool={tool} />
                            ))}
                          </div>
                        )}
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-sm leading-6 text-slate-100"><code>{group.commands.join('\n')}</code></pre>
                        {group.note && <p className="mt-2 text-sm leading-6 text-slate-600">{group.note}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </article>
              <article className="rounded-2xl bg-amber-50 p-4 shadow-sm ring-1 ring-amber-100">
                <p className="text-xs font-black uppercase tracking-wide text-amber-700">Safety</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">安全边界</h2>
                {safetyNotes.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-slate-700">暂无安全说明。</p>
                ) : (
                  <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-700">
                    {safetyNotes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          )}
        </>
      )}
    </div>
  );
}
