import { ToolPillLink } from '../components/ToolLink';

const promptGroups = [
  {
    title: '规格驱动和任务拆解',
    description: '使用 OpenSpec、Spec Kit、Superpowers 和 Claude Code 把需求变成可验证的实现步骤。',
    tools: ['OpenSpec', 'Spec Kit', 'Superpowers Skills', 'Claude Code'],
    prompts: [
      '请按规格驱动方式处理这个需求：先明确背景、目标、非目标、验收标准，再拆成可执行任务。',
      '根据这个需求生成 OpenSpec proposal 和 tasks，要求每个任务都能独立验证。',
      '用 Spec Kit 梳理这个功能的用户故事、数据流、边界条件和验收测试。',
    ],
  },
  {
    title: '生成测试用例',
    description: '从需求、issue 或 PR 改动中提取测试范围和可执行用例。',
    tools: ['Claude Code'],
    prompts: [
      '根据这个需求，帮我生成测试用例，包含：用例标题、前置条件、操作步骤、预期结果、优先级。',
      '根据 PR 改动生成测试点，按功能测试、异常测试、回归测试分类。',
      '根据 issue 描述补充边界场景和异常场景，并标出哪些适合自动化。',
    ],
  },
  {
    title: '执行冒烟测试',
    description: '用 Claude Code 启动项目，用 Playwright MCP 验证核心链路是否仍可用。',
    tools: ['Claude Code', 'Playwright MCP'],
    prompts: [
      '对当前项目做一次冒烟测试：启动服务、打开首页、检查登录、进入主要页面、记录发现的问题。',
      '只测试核心链路：登录、查询列表、新增记录、查看详情，并检查浏览器控制台错误。',
      '用 Playwright MCP 打开真实页面，验证桌面和移动端布局是否正常。',
    ],
  },
  {
    title: 'PR 验收和代码协作',
    description: '组合 GitHub MCP、Playwright MCP、MySQL MCP 和 Time MCP 完成 PR 验收。',
    tools: ['GitHub MCP', 'Playwright MCP', 'MySQL MCP', 'Time MCP'],
    prompts: [
      '查看 PR #45 的改动范围、提交记录和 CI 状态，判断需要重点回归哪些页面和接口。',
      '根据 PR 改动执行可自动化测试：先列测试点，再用浏览器验证页面，必要时只读查询数据库状态。',
      '把 CI 时间转换成本地时间，并输出一份 PR 验收意见：是否建议合并、原因、剩余风险。',
    ],
  },
  {
    title: 'Bug 复现和失败分析',
    description: '把失败定位到代码、测试、环境、浏览器、接口或数据层。',
    tools: ['GitHub MCP', 'Playwright MCP', 'MySQL MCP', 'Superpowers Skills'],
    prompts: [
      'CI 失败了，帮我查看失败日志并判断是代码问题、测试用例问题还是环境问题。',
      '页面操作失败了，请同时检查浏览器控制台、网络请求和页面提示。',
      '根据 issue #123 的复现步骤，用 Playwright MCP 复现问题，并用 MySQL MCP 只读检查相关数据状态。',
    ],
  },
  {
    title: '资料研究和指南更新',
    description: '使用 Firecrawl MCP 抓取公开资料，再由 Claude Code 整理成 FM AI Tools Hub 使用指南。',
    tools: ['Firecrawl MCP', 'Claude Code', 'Time MCP'],
    prompts: [
      '用 Firecrawl 抓取这个工具的公开文档，整理成 FM AI Tools Hub 使用指南，并保留来源、更新时间、示例提示词和安全边界。',
      '抓取这个发布说明页面，提取新增功能、修复内容、潜在风险，以及 FM AI Tools Hub 哪些指南需要更新。',
      '对比官方文档和当前 FM AI Tools Hub 内容，列出需要补充的使用场景、命令、提示词和注意事项。',
    ],
  },
  {
    title: 'UI 和前端设计',
    description: '使用 frontend-design 改进页面视觉、布局、响应式和可访问性。',
    tools: ['Frontend Design plugin', 'Playwright MCP', 'PicGo'],
    prompts: [
      '使用 frontend-design 帮我设计一个更高级的登录页，不要普通模板风格。',
      '帮我优化这个 dashboard 的布局、颜色、字体和卡片层级，让它更像生产级产品。',
      '检查这个页面的 UI/UX 问题，重点看对齐、间距、视觉层级、响应式和可访问性；完成后用 Playwright 截图验收。',
    ],
  },
  {
    title: '技能创建和优化',
    description: '使用 skill-creator 把团队流程沉淀成可复用 skill，并用 Superpowers 校验流程边界。',
    tools: ['Skill Creator plugin', 'Superpowers Skills', 'Claude Code'],
    prompts: [
      '使用 skill-creator 帮我创建一个测试报告生成 skill，写清触发场景、步骤、验证方式和安全边界。',
      '帮我优化这个 skill 的 description，让它更容易在正确场景触发，避免过宽导致误触发。',
      '为我们团队写一个 PR 验收 skill，包含查看改动、生成测试点、执行验证、输出结论。',
    ],
  },
  {
    title: '时间和排期处理',
    description: '使用 Time MCP 把相对日期、时区和验证时间写成明确结论。',
    tools: ['Time MCP'],
    prompts: [
      '把“今天、明天、下周五”转换成明确日期后再写进测试计划。',
      '把这个 UTC 时间转换成我的本地时间，并说明它对应哪一天。',
      '给测试报告补充验证时间、时区和结论时间，避免只写模糊的“今天”。',
    ],
  },
  {
    title: 'Python 工具和后端脚本',
    description: '使用 uv 管理 Python 工具、依赖和脚本执行，再用 API 或 MySQL 只读验证结果。',
    tools: ['uv', 'MySQL MCP'],
    prompts: [
      '使用 uv 运行这个后端脚本或测试，说明命令、输出、数据变化和验证结论。',
      '检查这个 Python 项目的依赖和工具入口，给出 uv 运行方式和常用命令。',
      '运行迁移或导入脚本前，先说明会修改哪些本地数据，并给出验证和回滚建议。',
    ],
  },
  {
    title: '图片和文档素材',
    description: '使用 PicGo 处理截图素材，但避免上传敏感页面、密钥或内部数据。',
    tools: ['PicGo', 'Playwright MCP'],
    prompts: [
      '为这份指南准备截图素材，先检查截图是否包含 token、客户数据、内部系统或个人隐私。',
      '把本地截图上传到图床，生成 Markdown 链接，并插入测试报告。',
      '整理一份带截图的验收报告，截图需要说明页面、操作步骤和验证结论。',
    ],
  },
  {
    title: '输出测试结论',
    description: '把执行过程整理成可读的验收结论。',
    tools: ['Claude Code', 'Time MCP'],
    prompts: [
      '根据刚才的测试结果，输出一份测试结论，包含：测试范围、通过项、失败项、风险、建议。',
      '帮我把测试过程整理成日报格式，包含验证时间、环境、范围、发现问题和后续建议。',
      '整理一份 PR 验收意见：是否建议合并、原因、剩余风险。',
    ],
  },
];

export function PromptTemplatePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Prompt Library</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">提示词模板库</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          把桌面指南里分散的常用提示词按任务场景归类，覆盖规格驱动、测试验收、资料研究、UI 设计、技能创建、时间处理、Python 工具和截图素材。
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {promptGroups.map((group) => (
          <article key={group.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-bold text-slate-950">{group.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.tools.map((tool) => (
                <ToolPillLink key={tool} name={tool} />
              ))}
            </div>
            <div className="mt-4 space-y-3">
              {group.prompts.map((prompt) => (
                <pre key={prompt} className="overflow-x-auto rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><code>{prompt}</code></pre>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
