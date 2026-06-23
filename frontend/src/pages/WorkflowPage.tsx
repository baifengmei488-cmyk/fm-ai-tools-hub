import { ToolPillLink } from '../components/ToolLink';

const workflows = [
  {
    title: '需求到开发',
    flow: 'OpenSpec / Spec Kit 明确规格 → Claude Code 实现 → Superpowers 约束流程 → Playwright 验证 UI → GitHub MCP 看 CI。',
    prompt: '请按规格驱动方式处理这个需求：先明确需求和验收标准，再拆任务、实现代码、运行验证并说明风险。',
    tools: ['OpenSpec', 'Spec Kit', 'Claude Code', 'Superpowers Skills', 'Playwright MCP', 'GitHub MCP'],
  },
  {
    title: 'PR 验收',
    flow: 'GitHub MCP 查看 PR → 分析改动范围 → Playwright 测页面 → MySQL 查数据 → Time MCP 记录验证时间 → 输出测试结论。',
    prompt: '查看 PR #45，分析改动范围，执行可自动化测试，并输出测试结论。',
    tools: ['GitHub MCP', 'Playwright MCP', 'MySQL MCP', 'Time MCP'],
  },
  {
    title: 'Bug 复现',
    flow: 'GitHub MCP 查看 issue → systematic-debugging 找根因 → Playwright 复现页面操作 → MySQL 验证数据状态。',
    prompt: '根据 issue #123 的复现步骤，用浏览器复现问题，并检查数据库相关数据。',
    tools: ['GitHub MCP', 'Superpowers Skills', 'Playwright MCP', 'MySQL MCP'],
  },
  {
    title: '公开资料研究',
    flow: 'Firecrawl 抓公开网页 → Claude Code 整理成指南 → PicGo 处理截图素材 → 写入 ToolVault。',
    prompt: '用 Firecrawl 抓取这个工具的公开文档，整理成 ToolVault 使用指南，并保留来源、更新时间、示例提示词和安全边界。',
    tools: ['Firecrawl MCP', 'Claude Code', 'PicGo'],
  },
  {
    title: 'UI 设计和页面验收',
    flow: 'Frontend Design 设计页面 → Claude Code 实现 → Playwright 打开真实页面 → PicGo 处理截图资料。',
    prompt: '使用 frontend-design 优化这个页面，完成后启动项目，用 Playwright 检查桌面和移动端布局、控制台错误和关键交互。',
    tools: ['Frontend Design plugin', 'Claude Code', 'Playwright MCP', 'PicGo'],
  },
  {
    title: '团队流程沉淀',
    flow: 'Skill Creator 把重复流程写成 skill → Superpowers 提供流程范式 → Claude Code 验证触发和执行效果。',
    prompt: '使用 skill-creator 把这个重复工作流做成 Claude Code skill，写清触发场景、执行步骤、验证方式和安全边界。',
    tools: ['Skill Creator plugin', 'Superpowers Skills', 'Claude Code'],
  },
  {
    title: 'Python 工具和后端脚本',
    flow: 'uv 管理 Python 环境和工具 → Claude Code 运行迁移/脚本/测试 → MySQL 或 API 验证结果。',
    prompt: '使用 uv 运行这个后端脚本或测试，说明命令、输出、数据变化和验证结论。',
    tools: ['uv', 'Claude Code', 'MySQL MCP'],
  },
];

const toolCombos = [
  {
    title: 'GitHub + Playwright',
    tools: ['GitHub MCP', 'Playwright MCP'],
    prompts: ['查看 PR #45 的改动，判断影响哪些页面，然后用 Playwright 回归测试这些页面。', '根据 issue #123 的复现步骤，用浏览器实际复现这个问题。'],
  },
  {
    title: 'Playwright + MySQL',
    tools: ['Playwright MCP', 'MySQL MCP'],
    prompts: ['用浏览器新增一个用户，然后查询数据库确认用户记录是否创建成功。', '提交订单后，检查页面提示和数据库订单状态是否一致。'],
  },
  {
    title: 'Firecrawl + Claude Code',
    tools: ['Firecrawl MCP', 'Claude Code'],
    prompts: ['用 Firecrawl 抓取公开文档，Claude Code 整理成 ToolVault 指南，重点写安装后怎么用和常见提示词。', '抓取这个发布说明页面，提取新增、修复、风险和需要更新的指南内容。'],
  },
  {
    title: 'Frontend Design + Playwright',
    tools: ['Frontend Design plugin', 'Playwright MCP'],
    prompts: ['使用 frontend-design 优化页面视觉，再用 Playwright 打开真实页面检查布局、响应式和控制台。', '把这个管理后台页面改得更现代，但保留现有交互，完成后截图验收。'],
  },
  {
    title: 'Skill Creator + Superpowers',
    tools: ['Skill Creator plugin', 'Superpowers Skills'],
    prompts: ['把我们团队的 PR 验收流程做成 skill，并参考 Superpowers 的验证和安全边界写法。', '检查这个 skill 的 description 是否过宽，是否容易误触发。'],
  },
  {
    title: 'Time + GitHub + 测试报告',
    tools: ['Time MCP', 'GitHub MCP'],
    prompts: ['查看 PR 的 CI 时间，把 UTC 转成本地时间，并写入测试结论。', '把“今天、明天、下周五”转换成明确日期后再写进计划。'],
  },
  {
    title: 'PicGo + 文档报告',
    tools: ['PicGo'],
    prompts: ['把本地截图上传到图床，生成 Markdown 链接，并插入测试报告。', '为这份指南准备截图素材，但不要上传敏感页面或内部数据。'],
  },
];

const promptTemplates = [
  {
    title: '生成测试用例',
    prompts: ['根据这个需求，帮我生成测试用例，包含：用例标题、前置条件、操作步骤、预期结果、优先级。', '根据 PR 改动生成测试点，按功能测试、异常测试、回归测试分类。'],
  },
  {
    title: '执行冒烟测试',
    prompts: ['对当前项目做一次冒烟测试：启动服务、打开首页、检查登录、进入主要页面、记录发现的问题。', '只测试核心链路：登录、查询列表、新增记录、查看详情。'],
  },
  {
    title: '分析失败原因',
    prompts: ['CI 失败了，帮我查看失败日志并判断是代码问题、测试用例问题还是环境问题。', '页面操作失败了，请同时检查浏览器控制台、网络请求和页面提示。'],
  },
  {
    title: '输出测试结论',
    prompts: ['根据刚才的测试结果，输出一份测试结论，包含：测试范围、通过项、失败项、风险、建议。', '整理一份 PR 验收意见：是否建议合并、原因、剩余风险。'],
  },
  {
    title: '指南和资料更新',
    prompts: ['用 Firecrawl 抓公开资料，用 Claude Code 更新指南，用 Time MCP 记录更新时间。', '把新截图用 PicGo 生成 Markdown 链接，再补进文档。'],
  },
];

const commands = ['claude --version', 'claude mcp list', 'claude mcp get playwright', 'claude mcp get github', 'claude mcp get mysql', 'claude mcp get firecrawl', 'claude mcp get time', 'openspec --version', 'uv --version', 'uv tool list', 'specify version', 'specify self check', 'claude plugin list', '/plugin', '/reload-plugins', 'open -a PicGo'];

const safetyNotes = [
  '不要把 token、密码、cookie、API Key 或生产连接串发到聊天里。',
  '数据库 MCP 使用只读账号，默认不要连接生产数据库。',
  'Firecrawl 只抓公开或已授权网页，不抓付费墙、内部系统或敏感内容。',
  'PicGo 不上传包含密钥、客户数据、内部系统截图或个人隐私的图片。',
  '删除、支付、发消息、改权限、合并、发布等危险操作前必须先确认。',
  '自动化浏览器可能真的点击按钮，涉及外部系统时要区分测试环境和生产环境。',
  '初始化工具可能生成文件，最好在干净分支或隔离工作区执行。',
];

export function WorkflowPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">导航型使用说明</p>
        <h1 className="mt-3 text-3xl font-bold">实用工作流</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">
          把桌面使用指南里的总结性内容整理成“我要做什么 → 推荐用哪些工具 → 可以直接复制什么提示词”。单个工具的深度指南仍在工具详情页，这里负责组合、导航和速查。
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">Workflow</p>
            <h2 className="text-2xl font-bold text-slate-950">推荐组合工作流</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {workflows.map((workflow) => (
            <article key={workflow.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-lg font-bold text-slate-950">{workflow.title}</h3>
              <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-950">{workflow.flow}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {workflow.tools.map((tool) => (
                  <ToolPillLink key={tool} name={tool} />
                ))}
              </div>
              <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code>{workflow.prompt}</code></pre>
            </article>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold text-blue-700">Tool Combinations</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">组合使用示例</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {toolCombos.map((combo) => (
            <article key={combo.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-bold text-slate-950">{combo.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {combo.tools.map((tool) => (
                  <ToolPillLink key={tool} name={tool} />
                ))}
              </div>
              <div className="mt-3 space-y-3">
                {combo.prompts.map((prompt) => (
                  <pre key={prompt} className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><code>{prompt}</code></pre>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="prompt-templates">
        <p className="text-sm font-semibold text-blue-700">Prompt Templates</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">测试人员常用提示词模板</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {promptTemplates.map((group) => (
            <article key={group.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-bold text-slate-950">{group.title}</h3>
              <div className="mt-3 space-y-3">
                {group.prompts.map((prompt) => (
                  <pre key={prompt} className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><code>{prompt}</code></pre>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article id="commands" className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-semibold text-blue-700">Command Cheatsheet</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">快速命令汇总</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-7 text-slate-100"><code>{commands.join('\n')}</code></pre>
        </article>
        <article className="rounded-2xl bg-amber-50 p-5 shadow-sm ring-1 ring-amber-100">
          <p className="text-sm font-semibold text-amber-700">Safety</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">安全边界</h2>
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
