import { ToolLink } from '../components/ToolLink';

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

const safetyNotes = [
  '不要把 token、密码、cookie、API Key 或生产连接串发到聊天里。',
  '不要把密钥写入项目文件或 FM AI Tools Hub 导入 JSON。',
  '数据库 MCP 使用只读账号，默认不要连接生产数据库。',
  'Firecrawl 只抓公开或已授权网页，不抓付费墙、内部系统或敏感内容。',
  'PicGo 不上传包含密钥、客户数据、内部系统截图或个人隐私的图片。',
  '删除、支付、发消息、改权限、合并、发布等危险操作前必须先确认。',
  '自动化浏览器可能真的点击按钮，涉及外部系统时要区分测试环境和生产环境。',
  '初始化工具可能生成文件，最好在干净分支或隔离工作区执行。',
];

const choices = [
  { need: '浏览器操作、截图、控制台、网络请求、E2E 回归', tools: ['Playwright MCP'] },
  { need: 'PR、issue、CI、review、代码协作和仓库信息', tools: ['GitHub MCP'] },
  { need: '只读查表结构、抽样数据、验证落库和状态一致性', tools: ['MySQL MCP'] },
  { need: '公开网页抓取、文档整理、发布说明和竞品研究', tools: ['Firecrawl MCP'] },
  { need: '当前时间、时区转换、相对日期和测试报告时间戳', tools: ['Time MCP'] },
  { need: '需求规格、proposal、tasks、验收标准和变更流程', tools: ['OpenSpec', 'Spec Kit'] },
  { need: 'Claude Code 任务执行、代码修改、测试验证和项目协作', tools: ['Claude Code'] },
  { need: '流程纪律、调试方法、TDD、验证和可复用工作习惯', tools: ['Superpowers Skills'] },
  { need: '前端页面视觉设计、布局优化、响应式和可访问性', tools: ['Frontend Design plugin'] },
  { need: '创建、修改、评估和优化自定义 skills', tools: ['Skill Creator plugin'] },
  { need: '高速 Python 工具、包和项目运行管理', tools: ['uv'] },
  { need: '图片上传和图床管理', tools: ['PicGo'] },
];

const workflowTips = [
  { scenario: '需求还不清楚', tools: ['OpenSpec', 'Spec Kit', 'Claude Code'], suggestion: '先明确规格，再让 Claude Code 实现。' },
  { scenario: '页面效果不好', tools: ['Frontend Design plugin', 'Playwright MCP'], suggestion: '先设计页面，再打开真实页面验收。' },
  { scenario: 'PR 不知道测什么', tools: ['GitHub MCP', 'Playwright MCP', 'MySQL MCP', 'Time MCP'], suggestion: '先看改动，再组合页面、数据和时间信息输出结论。' },
  { scenario: '资料需要更新', tools: ['Firecrawl MCP', 'Claude Code'], suggestion: '抓公开资料后整理进 FM AI Tools Hub。' },
  { scenario: '重复流程太多', tools: ['Skill Creator plugin', 'Superpowers Skills'], suggestion: '写成 skill，并参考流程安全边界和验证方式。' },
  { scenario: '需要截图报告', tools: ['Playwright MCP', 'PicGo'], suggestion: '先截图验收，再处理可公开的图片素材。' },
];

export function GuideNavigationPage() {
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

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-lg font-bold text-slate-950">按任务选择工具</h2>
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
                        <ToolLink key={tool} name={tool} />
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-lg font-bold text-slate-950">常见组合路线</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {workflowTips.map((tip) => (
            <div key={tip.scenario} className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{tip.scenario}</p>
              <p className="mt-2 flex flex-wrap gap-2 text-sm leading-6">
                {tip.tools.map((tool) => (
                  <ToolLink key={tool} name={tool} />
                ))}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{tip.suggestion}</p>
            </div>
          ))}
        </div>
      </section>

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
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
            {safetyNotes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
