import { useSearchParams } from 'react-router-dom';
import { usePageContent } from '../api/usePageContent';
import { ToolRefPillLink } from '../components/ToolRefLink';

type WorkflowTab = 'workflows' | 'prompts' | 'commands';

const tabs: Array<{ key: WorkflowTab; label: string; description: string }> = [
  { key: 'workflows', label: '工作流', description: '组合路线、工具搭配和可复制执行提示。' },
  { key: 'prompts', label: '提示词', description: '测试、调研、验收和复盘时可直接改写的提示词。' },
  { key: 'commands', label: '命令', description: '常用 MCP、CLI、插件和项目维护命令速查。' },
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
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">导航型使用说明</p>
        <h1 className="mt-3 text-3xl font-bold">实用工作流</h1>
        <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-200">
          把桌面使用指南里的总结性内容整理成“我要做什么 → 推荐用哪些工具 → 可以直接复制什么提示词”。单个工具的深度指南仍在工具详情页，这里负责组合、导航和速查。
        </p>
      </section>

      {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载每日工作流内容...</p>}
      {status === 'error' && <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 shadow-sm ring-1 ring-red-100">每日工作流内容加载失败，请稍后重试。</p>}

      {status === 'ready' && (
        <>
          <section className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
            <div className="grid gap-2 md:grid-cols-3" role="tablist" aria-label="工作流内容分类">
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
                    className={`rounded-xl px-4 py-3 text-left transition ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                    onClick={() => selectTab(tab.key)}
                  >
                    <span className="block font-semibold">{tab.label}</span>
                    <span className={`mt-1 block text-xs leading-5 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>{tab.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {activeTab === 'workflows' && (
            <div id="workflows-panel" role="tabpanel" aria-labelledby="workflows-tab" className="space-y-8">
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
            </div>
          )}

          {activeTab === 'prompts' && (
            <section id="prompts-panel" role="tabpanel" aria-labelledby="prompts-tab">
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
          )}

          {activeTab === 'commands' && (
            <div id="commands-panel" role="tabpanel" aria-labelledby="commands-tab" className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-blue-700">Command Cheatsheet</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">快速命令汇总</h2>
                {commandGroups.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-600">暂无命令。</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {commandGroups.map((group) => (
                      <div key={group.title} className="rounded-xl bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-950">{group.title}</h3>
                        {group.tools.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {group.tools.map((tool) => (
                              <ToolRefPillLink key={`${group.title}-${tool.slug || tool.name}`} tool={tool} />
                            ))}
                          </div>
                        )}
                        <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-7 text-slate-100"><code>{group.commands.join('\n')}</code></pre>
                        {group.note && <p className="mt-3 text-sm leading-6 text-slate-600">{group.note}</p>}
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
