const thesisCards = [
  {
    title: '从测试负责人视角理解复杂系统',
    text: '需求、业务、产品、开发、后台、数据库、运维、运营，都要放在同一张图里看。',
  },
  {
    title: '从业务流程视角做自动化',
    text: '先拆清角色、输入、输出、异常和验收，再决定哪些部分值得自动化。',
  },
  {
    title: '从交付视角设计稳定性',
    text: '配置、日志、截图、补跑、状态、通知和交接，不是附加项，而是项目能用起来的关键。',
  },
  {
    title: '从 AI 工具视角沉淀知识',
    text: '把工具、提示词、工作流和经验整理成可检索、可更新、可复用的知识产品。',
  },
];

const caseStudies = [
  {
    number: 'CASE 01',
    title: 'RPA 自动化项目群',
    summary:
      '围绕电商财务、发票、结算、登录态、任务调度和运维交接，将多平台、多系统、多文件、多规则的人工流程，整理为可配置、可追踪、可补跑的自动化项目群。',
    complexity: '天猫、抖音、京东、拼多多等平台规则不同；账单、发票、结算、费用映射和异常路径分散在多个系统与文件中。',
    method: '先拆流程和数据口径，再用 Playwright、pandas、openpyxl、API 集成处理登录态、下载、清洗、核对、调度和失败补跑。',
    delivery: '不止写脚本，还补齐任务状态、日志截图、Cron 定时、成功率统计、Runbook、PRD、交接说明和可复用 Skills。',
    tags: ['业务流程拆解', 'Playwright', '数据核对', '幂等补跑', '运维交付'],
  },
  {
    number: 'CASE 02',
    title: 'ToolVault / FM AI Tools Hub',
    summary:
      '一个 local-first 的 AI 工具知识库，把 Claude Code、MCP、skills、CLI 和日常开发测试工具整理成工具目录、使用指南、工作流、提示词、命令清单和更新日志。',
    complexity: 'AI 工具多、资料碎、入口分散，很多工具不是“安装了就会用”，真正难的是知道何时使用、如何组合、怎么验证。',
    method: '用产品化方式设计工具目录、详情页、Markdown 安全渲染、导入 schema、敏感信息扫描、page_content 和更新日志。',
    delivery: '把个人探索和项目经验转成可检索、可更新、可复核的知识产品，让 AI 工具使用从“临时经验”变成“稳定工作流”。',
    tags: ['产品设计', '全栈实现', 'AI 工具应用', '安全意识', '知识产品化'],
  },
];

const methodSteps = [
  {
    index: '01',
    title: '先理解业务目的',
    text: '它要解决谁的问题？现在卡在哪里？哪些角色参与？成功标准是什么？',
  },
  {
    index: '02',
    title: '再拆流程和风险',
    text: '输入、输出、状态、异常、权限、数据口径、验收标准逐一拆清楚。',
  },
  {
    index: '03',
    title: '再设计自动化与验证',
    text: '决定哪些环节适合自动化，哪些需要人工确认，哪些结果需要日志和截图留痕。',
  },
  {
    index: '04',
    title: '最后沉淀成可交接系统',
    text: '配置、补跑、通知、Runbook、PRD、验收清单和工具说明一起交付。',
  },
];

const capabilityCards = [
  {
    title: '业务与需求理解',
    text: '能从用户、业务、产品、开发、测试多个角度理解流程，拆出角色、输入输出、异常路径和验收标准。',
    evidence: 'RPA 项目前期流程拆解、数据口径确认、多平台规则整理。',
  },
  {
    title: '测试质量与风险识别',
    text: '测试负责人背景，关注需求评审、测试计划、缺陷跟踪、上线验收和质量风险。',
    evidence: '大型测试项目经验、跨部门沟通、验收把控。',
  },
  {
    title: '自动化开发与数据处理',
    text: '使用 Python、Playwright、pandas、openpyxl、requests 处理浏览器自动化、接口调用和复杂 Excel/账单数据。',
    evidence: '多平台发票、结算核对、登录态和任务调度模块。',
  },
  {
    title: '流程稳定性与运维交付',
    text: '关注任务状态、失败重试、幂等补跑、日志截图、共享目录、通知和交接。',
    evidence: 'RPA 管理平台、Cron 定时、成功率统计、Runbook。',
  },
  {
    title: '产品化与文档沉淀',
    text: '把分散经验整理成 PRD、需求矩阵、验收清单、Skills、知识库和可复用工作流。',
    evidence: 'ToolVault 页面内容体系、更新日志、指南和导入 schema。',
  },
  {
    title: 'AI 工具与人机协作',
    text: '使用 Claude Code、MCP 和 AI 工具辅助代码理解、流程整理、问题排查和知识沉淀。',
    evidence: 'FM AI Tools Hub、工具使用指南、提示词模板和工作流沉淀。',
  },
];

function SectionHeading({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">{kicker}</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-black leading-tight tracking-[-0.055em] text-slate-950 md:text-4xl">{title}</h2>
      </div>
      {text ? <p className="max-w-xl text-sm leading-7 text-slate-500 md:text-base">{text}</p> : null}
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="-mx-4 -my-4 overflow-hidden bg-gradient-to-b from-blue-50 via-slate-50 to-slate-100 px-4 py-5 sm:-mx-5 sm:px-5 lg:-my-5 lg:py-7">
      <div className="mx-auto max-w-[1360px] overflow-hidden rounded-[2rem] border border-slate-300/60 bg-white/85 shadow-2xl shadow-slate-900/15 backdrop-blur md:rounded-[2.25rem]">
        <nav className="flex flex-col gap-4 border-b border-slate-200/80 bg-white/70 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7" aria-label="FM 个人主页导航">
          <div className="flex items-center gap-3 font-black tracking-[-0.03em] text-slate-950">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-xs text-white shadow-lg shadow-slate-900/20">FM</span>
            <span>FM Personal Portfolio</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black text-slate-500 md:text-sm">
            {['关于 FM', 'Case Studies', 'Method', 'Capability', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().split(' ').join('-')}`} className="rounded-full px-3 py-1.5 transition hover:bg-blue-50 hover:text-blue-700">
                {item}
              </a>
            ))}
          </div>
        </nav>

        <section id="关于-fm" className="grid min-h-[680px] gap-0 bg-[radial-gradient(circle_at_82%_18%,rgba(59,130,246,0.17),transparent_31%),linear-gradient(135deg,#ffffff_0%,#f8fafc_44%,#edf4ff_100%)] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="flex flex-col justify-center px-6 py-12 md:px-10 lg:px-14 lg:py-16">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200/80 bg-blue-100/80 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_0_5px_rgba(37,99,235,0.14)]" />
              Business · Quality · Automation · AI Tools
            </span>
            <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.08em] text-slate-950 md:text-7xl lg:text-8xl">
              在复杂业务系统里，把需求、质量、流程和工具连接起来。
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-slate-600 md:text-lg md:leading-9">
              我不是只关注“脚本能不能跑”，也不是只看页面有没有问题。我更关注一件事能不能被真正
              <strong className="font-black text-slate-950">理解、验证、稳定交付，并沉淀成别人也能复用的方法</strong>。
            </p>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {thesisCards.map((card) => (
                <article key={card.title} className="rounded-[1.35rem] border border-slate-200/80 bg-white/75 p-4 shadow-lg shadow-slate-900/5">
                  <h2 className="text-sm font-black text-slate-950 md:text-base">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{card.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center px-6 pb-12 lg:px-12 lg:py-12">
            <div role="img" aria-label="FM 抽象人物剪影" className="relative min-h-[520px] w-full max-w-[430px] overflow-hidden rounded-[2.75rem] border border-white/80 bg-[linear-gradient(160deg,#0f172a_0%,#1e3a8a_54%,#eff6ff_54.2%,#ffffff_100%)] shadow-2xl shadow-slate-900/25">
              <div className="absolute left-1/2 top-20 h-32 w-32 -translate-x-1/2 rounded-full bg-gradient-to-br from-slate-50 to-slate-300 shadow-2xl shadow-slate-950/20" />
              <div className="absolute left-1/2 top-56 h-64 w-64 -translate-x-1/2 rounded-t-[8rem] rounded-b-[2.5rem] bg-gradient-to-br from-slate-50 via-blue-100 to-blue-200 shadow-2xl shadow-slate-950/20 ring-1 ring-white/80" />
              <div className="absolute bottom-8 left-8 right-8 rounded-[1.4rem] border border-white/20 bg-white/10 p-4 text-white backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">Abstract identity</p>
                <p className="mt-1 text-2xl font-black tracking-[-0.05em]">FM</p>
              </div>
            </div>
            <div className="absolute left-4 top-16 rounded-[1.35rem] border border-slate-200/70 bg-white/90 p-4 shadow-xl shadow-slate-900/15 backdrop-blur md:left-8">
              <p className="text-sm font-black text-slate-950">FM</p>
              <p className="mt-1 text-xs text-slate-500">抽象形象，不暴露真实姓名</p>
            </div>
            <div className="absolute bottom-28 right-4 rounded-[1.35rem] border border-slate-200/70 bg-white/90 p-4 shadow-xl shadow-slate-900/15 backdrop-blur md:right-8">
              <p className="text-sm font-black text-slate-950">Testing Lead → Automation Builder</p>
              <p className="mt-1 text-xs text-slate-500">质量意识 + 业务理解 + 工具落地</p>
            </div>
            <div className="absolute bottom-10 left-6 rounded-[1.35rem] border border-slate-200/70 bg-white/90 p-4 shadow-xl shadow-slate-900/15 backdrop-blur md:left-12">
              <p className="text-sm font-black text-slate-950">关键词</p>
              <p className="mt-1 text-xs text-slate-500">可验证 · 可补跑 · 可交接 · 可复用</p>
            </div>
          </div>
        </section>

        <section id="case-studies" className="border-t border-slate-200/80 px-6 py-12 md:px-10 lg:px-14">
          <SectionHeading
            kicker="Case Studies"
            title="不是项目罗列，而是复杂问题的处理证据。"
            text="每个作品都用“复杂性 → 方法 → 沉淀”的方式讲清楚，体现业务理解、质量判断、自动化实现和交付意识。"
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {caseStudies.map((caseStudy) => (
              <article key={caseStudy.title} className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 md:p-7">
                <div className="absolute -right-14 -top-14 h-52 w-52 rounded-full bg-blue-600/10" />
                <p className="relative text-xs font-black uppercase tracking-[0.16em] text-blue-700">{caseStudy.number}</p>
                <h3 className="relative mt-7 text-3xl font-black leading-none tracking-[-0.06em] text-slate-950 md:text-4xl">{caseStudy.title}</h3>
                <p className="relative mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">{caseStudy.summary}</p>
                <dl className="relative mt-5 grid gap-3">
                  {[
                    ['复杂性', caseStudy.complexity],
                    ['处理方法', caseStudy.method],
                    ['交付沉淀', caseStudy.delivery],
                  ].map(([label, text]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <dt className="text-sm font-black text-slate-900">{label}</dt>
                      <dd className="mt-2 text-sm leading-6 text-slate-600">{text}</dd>
                    </div>
                  ))}
                </dl>
                <div className="relative mt-5 flex flex-wrap gap-2">
                  {caseStudy.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="method" className="border-t border-slate-200/80 px-6 py-12 md:px-10 lg:px-14">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-xl shadow-slate-900/15">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Working Method</p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.055em] md:text-4xl">我真正擅长的，不是单点技能，而是把复杂事情推进到可交付。</h2>
              <p className="mt-5 text-sm leading-8 text-slate-300 md:text-base">
                很多问题表面上是“功能怎么做”“脚本怎么写”“页面怎么测”，但真正影响结果的是：业务目标有没有理解清楚，风险有没有提前识别，异常有没有处理路径，结果能不能复核，别人能不能接手。
              </p>
            </div>
            <div className="grid gap-3">
              {methodSteps.map((step) => (
                <article key={step.index} className="grid grid-cols-[3.3rem_1fr] gap-4 rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 text-sm font-black text-blue-700">{step.index}</span>
                  <div>
                    <h3 className="font-black text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-slate-950 to-blue-950 px-6 py-12 text-white md:px-10 lg:px-14">
          <blockquote className="max-w-5xl text-3xl font-black leading-snug tracking-[-0.045em] md:text-4xl">
            我会把自己放在业务、产品、开发、测试、运营和用户之间，先把关系看清楚，再判断哪里是真正的关键问题。
          </blockquote>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
            这也是测试负责人经历带来的底层能力：不是只站在一个角色看问题，而是把多个角色的信息拼起来，形成更可行、更稳定、更容易被使用的方案。
          </p>
        </section>

        <section id="capability" className="border-t border-slate-200/80 px-6 py-12 md:px-10 lg:px-14">
          <SectionHeading kicker="Capability Map" title="能力不是标签，而是有项目证据的组合。" text="用能力地图替代普通能力清单，每一项都绑定具体项目、方法和交付结果。" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {capabilityCards.map((card) => (
              <article key={card.title} className="rounded-[1.7rem] border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5">
                <h3 className="text-lg font-black tracking-[-0.025em] text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{card.text}</p>
                <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-6 text-slate-700">
                  <span className="font-black">证据：</span>
                  {card.evidence}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer id="contact" className="flex flex-col gap-5 bg-slate-950 px-6 py-10 text-white md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Contact</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.055em]">如果你对这些项目、方法或工具感兴趣。</h2>
            <p className="mt-3 text-sm text-slate-300">可以通过邮箱或微信联系 FM。</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-black">
            <a href="mailto:write218@163.com" className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-white hover:bg-white/15">
              write218@163.com
            </a>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-3 text-white">bfm_135</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
