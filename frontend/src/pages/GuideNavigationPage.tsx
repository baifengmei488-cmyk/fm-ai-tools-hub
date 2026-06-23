import { usePageContent } from '../api/usePageContent';
import { ToolRefLink } from '../components/ToolRefLink';

const mcpExamples = [
  '打开网页并测试登录流程，检查控制台错误和关键网络请求。',
  '查看这个 GitHub PR 的改动范围、CI 状态和 review 评论。',
  '查询数据库里最近 10 条订单，只读验证页面状态是否和数据一致。',
  '抓取这个公开文档页面，整理成 FM AI Tools Hub 使用指南并保留来源。',
  '把这个 UTC 时间转换成本地时间，并写入测试结论。',
];

const scopeRows = [
  ['user', '全局用户配置，所有项目都能使用，适合个人常用 MCP。'],
  ['project', '当前项目配置，适合团队共享，但不要放真实密钥。'],
  ['local', '当前机器当前项目配置，适合个人私密配置或本地调试。'],
];

export function GuideNavigationPage() {
  const { pageContent, status } = usePageContent();
  const choices = pageContent.guide_choices;
  const workflowTips = pageContent.guide_workflow_tips;
  const safetyNotes = pageContent.guide_safety_notes;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Guide Navigation</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">工具使用导航</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          这里放“怎么选工具、怎么开始、什么不能做”的导航性说明；具体工具的完整指南仍在工具详情页。
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-bold text-slate-950">MCP 是什么</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            MCP 是 Model Context Protocol，可以理解为给 Claude Code 接入外部工具的协议。安装 MCP 后，你可以直接用自然语言让 Claude 调用浏览器、GitHub、数据库、公开网页抓取或时间工具。
          </p>
          <div className="mt-4 space-y-3">
            {mcpExamples.slice(0, 3).map((example) => (
              <pre key={example} className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><code>{example}</code></pre>
            ))}
          </div>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-bold text-slate-950">MCP 装了以后怎么使用？</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">不用记具体工具命令，直接用自然语言描述目标、范围、环境和安全边界即可。</p>
          <div className="mt-4 space-y-3">
            {mcpExamples.slice(3).map((example) => (
              <pre key={example} className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><code>{example}</code></pre>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">Claude 会根据任务选择合适的 MCP 工具。</p>
        </article>
      </section>

      {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载每日工具导航...</p>}
      {status === 'error' && <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 shadow-sm ring-1 ring-red-100">每日工具导航加载失败，请稍后重试。</p>}

      {status === 'ready' && (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-bold text-slate-950">按任务选择工具</h2>
            {choices.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">暂无工具选择建议。</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr><th className="px-4 py-3">我想做什么</th><th className="px-4 py-3">优先考虑</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {choices.map((choice) => (
                      <tr key={choice.need}>
                        <td className="px-4 py-3 text-slate-700">{choice.need}</td>
                        <td className="px-4 py-3 font-semibold text-slate-950">
                          <span className="flex flex-wrap gap-2">
                            {choice.tools.map((tool) => (
                              <ToolRefLink key={`${choice.need}-${tool.slug || tool.name}`} tool={tool} />
                            ))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-bold text-slate-950">常见组合路线</h2>
            {workflowTips.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">暂无组合路线。</p>
            ) : (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {workflowTips.map((tip) => (
                  <div key={tip.scenario} className="rounded-xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-950">{tip.scenario}</p>
                    {tip.tools.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-2 text-sm leading-6">
                        {tip.tools.map((tool) => (
                          <ToolRefLink key={`${tip.scenario}-${tool.slug || tool.name}`} tool={tool} />
                        ))}
                      </p>
                    )}
                    <p className="mt-2 text-sm leading-6 text-slate-600">{tip.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-lg font-bold text-slate-950">MCP 作用域说明</h2>
          <div className="mt-4 space-y-3">
            {scopeRows.map(([scope, description]) => (
              <div key={scope} className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <span className="font-mono font-semibold text-slate-950">-s {scope}</span>：{description}
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-2xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-100">
          <h2 className="text-lg font-bold text-slate-950">安全注意事项</h2>
          {status === 'ready' && safetyNotes.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-slate-700">暂无安全注意事项。</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
              {safetyNotes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
