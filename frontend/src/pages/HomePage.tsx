import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">开发 / 测试工具知识库</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-950">ToolVault</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        记录 Claude Code MCP、插件、skills、CLI 工具、桌面应用和数据库工具，并沉淀使用指南、测试流程和未来 runbook 候选。
      </p>
      <Link className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 font-medium text-white" to="/tools">
        浏览工具库
      </Link>
    </section>
  );
}
