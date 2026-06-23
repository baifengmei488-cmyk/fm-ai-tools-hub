import { ToolLink, ToolPillLink } from '../components/ToolLink';

const commandGroups = [
  {
    title: 'Claude Code',
    tools: ['Claude Code'],
    commands: ['claude --version'],
    note: '先确认 Claude Code 状态，再决定使用哪个工具处理当前任务。',
  },
  {
    title: 'MCP 服务器',
    tools: ['Playwright MCP', 'GitHub MCP', 'MySQL MCP', 'Firecrawl MCP', 'Time MCP'],
    commands: ['claude mcp list'],
    note: '查看 MCP 配置时只确认连接状态和脱敏配置，不要把真实 API Key、cookie、密码或生产连接串写入项目文件。',
  },
  {
    title: 'Playwright MCP',
    tools: ['Playwright MCP'],
    commands: ['claude mcp get playwright'],
    note: '用于浏览器自动化、截图、控制台和网络请求检查；涉及真实外部系统时，危险点击前需要确认。',
  },
  {
    title: 'GitHub MCP',
    tools: ['GitHub MCP'],
    commands: ['claude mcp get github'],
    note: '用于查看 issue、PR、CI、review 和仓库信息；评论、合并、关闭等共享状态变更前需要确认。',
  },
  {
    title: 'MySQL MCP',
    tools: ['MySQL MCP'],
    commands: ['claude mcp get mysql'],
    note: '只使用只读账号查询表结构、抽样数据和验证状态，不执行写入、删除或生产变更。',
  },
  {
    title: 'Firecrawl MCP',
    tools: ['Firecrawl MCP'],
    commands: ['claude mcp get firecrawl'],
    note: '只抓取公开或已授权网页，用于文档整理、发布说明提取和指南更新，不抓付费墙、内部系统或敏感内容。',
  },
  {
    title: 'Time MCP',
    tools: ['Time MCP'],
    commands: ['claude mcp get time'],
    note: '用于当前时间、时区转换、相对日期和测试报告时间戳。',
  },
  {
    title: 'OpenSpec',
    tools: ['OpenSpec'],
    commands: ['openspec --version', 'openspec init'],
    note: '初始化会修改项目目录，建议在新分支或干净工作区执行。',
  },
  {
    title: 'Spec Kit',
    tools: ['Spec Kit'],
    commands: ['specify version', 'specify self check'],
    note: '用于规格驱动开发前的环境检查和需求结构化。',
  },
  {
    title: 'uv',
    tools: ['uv'],
    commands: ['uv --version', 'uv tool list'],
    note: '用于高速 Python 工具、包和项目运行管理，适合后端脚本、迁移、测试和 CLI 工具。',
  },
  {
    title: 'Claude Code 插件',
    tools: ['Frontend Design plugin', 'Skill Creator plugin', 'Claude Code'],
    commands: ['claude plugin list', '/plugin', '/reload-plugins'],
    note: 'frontend-design 和 skill-creator 属于 Claude Code 插件能力；安装或更新后通常需要 /reload-plugins 生效。',
  },
  {
    title: 'PicGo 桌面应用',
    tools: ['PicGo'],
    commands: ['open -a PicGo'],
    note: '用于图片上传和图床管理；上传前先确认截图不含密钥、客户数据、内部页面或个人隐私。',
  },
];

export function CommandPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Cheatsheet</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">快速命令汇总</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          把 Claude Code、MCP、OpenSpec、Spec Kit、uv、插件和 PicGo 的常用检查命令集中放在这里，作为日常操作速查。
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {commandGroups.map((group) => (
          <article key={group.title} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-bold text-slate-950"><ToolLink name={group.title} /></h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.tools.map((tool) => (
                <ToolPillLink key={tool} name={tool} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {group.commands.map((command) => (
                <pre key={command} className="overflow-x-auto rounded-xl bg-slate-950 p-3 text-sm leading-6 text-slate-100"><code>{command}</code></pre>
              ))}
            </div>
            {group.note && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">{group.note}</p>}
          </article>
        ))}
      </section>
    </div>
  );
}
