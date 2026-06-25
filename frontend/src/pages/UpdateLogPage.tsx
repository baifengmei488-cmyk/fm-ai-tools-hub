import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, type UpdateLogChange, type UpdateLogChangeDetail, type UpdateLogEntry } from '../api/client';

function statusClassName(status: string) {
  if (status === 'failed') {
    return 'bg-red-50 text-red-700 ring-red-100';
  }
  return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
}

function validationClassName(status: string) {
  if (status === 'failed') {
    return 'bg-amber-50 text-amber-800 ring-amber-100';
  }
  return 'bg-blue-50 text-blue-700 ring-blue-100';
}

function formatBeijingTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
}

function sourceSummary(log: UpdateLogEntry) {
  if (log.sources.length === 0) {
    return log.source;
  }

  const titles = log.sources.slice(0, 2).map((source) => source.title);
  const overflow = log.sources.length - titles.length;
  return overflow > 0 ? `${titles.join('、')} +${overflow}` : titles.join('、');
}

function ChangeBucket({ label, slugs = [], className }: { label: string; slugs?: string[]; className: string }) {
  if (slugs.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {slugs.map((slug) => (
          <span key={`${label}-${slug}`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}>
            {slug}
          </span>
        ))}
      </div>
    </div>
  );
}

function pagePathLink(path: string) {
  if (path === '/prompts') {
    return { href: '/workflows?tab=prompts', label: '工作流 · 提示词' };
  }
  if (path === '/commands') {
    return { href: '/workflows?tab=commands', label: '工作流 · 命令' };
  }
  if (path.startsWith('/') && !path.includes('{')) {
    return { href: path, label: path };
  }
  return undefined;
}

function CollapsibleSection({ title, summary, tone = 'slate', children }: { title: string; summary: string; tone?: 'slate' | 'blue'; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerClassName = tone === 'blue' ? 'mt-5 rounded-xl bg-blue-50 p-4' : 'mt-5 rounded-xl bg-slate-50 p-4';
  const buttonClassName = tone === 'blue' ? 'text-blue-700 hover:text-blue-900' : 'text-slate-700 hover:text-slate-950';

  return (
    <section className={containerClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{summary}</p>
        </div>
        <button className={`rounded-full bg-white px-3 py-1.5 text-xs font-bold ring-1 ring-slate-200 ${buttonClassName}`} type="button" onClick={() => setIsOpen((current) => !current)}>
          {isOpen ? `收起${title}` : `展开${title}`}
        </button>
      </div>
      {isOpen && <div className="mt-4">{children}</div>}
    </section>
  );
}

function parseExecutionReportLine(line: string) {
  const match = line.match(/^([^:：]{1,24})[:：]\s*(.*)$/);
  if (!match) {
    return { label: '记录', value: line };
  }
  return { label: match[1], value: match[2] };
}

function ExecutionReportValue({ value }: { value: string }) {
  const parts = value.split(/\s+/).filter(Boolean);
  const shouldSplit = parts.length > 1 && parts.every((part) => part.includes('='));

  if (!shouldSplit) {
    return <span className="min-w-0 break-words text-slate-700">{value}</span>;
  }

  return (
    <span className="flex min-w-0 flex-wrap gap-1.5">
      {parts.map((part) => (
        <span key={part} className="rounded-full bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-700 ring-1 ring-slate-100">
          {part}
        </span>
      ))}
    </span>
  );
}

function ExecutionReportRows({ lines = [] }: { lines?: string[] }) {
  if (lines.length === 0) {
    return <p className="rounded-xl bg-white p-3 text-sm text-slate-600 ring-1 ring-slate-100">本次更新没有执行结果报告。</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
      {lines.map((line, index) => {
        const row = parseExecutionReportLine(line);
        return (
          <div key={`${line}-${index}`} className="grid gap-1 border-b border-slate-100 px-3 py-2 text-sm leading-6 last:border-b-0 md:grid-cols-[8rem_1fr]">
            <span className="font-semibold text-slate-950">{row.label}：</span>
            <ExecutionReportValue value={row.value} />
          </div>
        );
      })}
    </div>
  );
}

function ChangeDetailList({ details = [] }: { details?: UpdateLogChangeDetail[] }) {
  if (details.length === 0) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-blue-100">
      <div className="grid gap-2 bg-blue-100/60 px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-900 md:grid-cols-[1.1fr_1.1fr_0.9fr_1.2fr_0.7fr_1fr]">
        <span>工具</span>
        <span>页面</span>
        <span>栏目</span>
        <span>字段</span>
        <span>动作</span>
        <span>来源</span>
      </div>
      <div className="divide-y divide-blue-100">
        {details.map((detail) => {
          const pageLink = pagePathLink(detail.page_path);
          return (
            <div key={`${detail.tool_slug}-${detail.page_path}-${detail.section}-${detail.field}-${detail.change_type}`} className="grid gap-2 px-3 py-3 text-sm leading-6 text-blue-950 md:grid-cols-[1.1fr_1.1fr_0.9fr_1.2fr_0.7fr_1fr]">
              <div className="min-w-0 break-words">
                {detail.tool_slug ? (
                  <Link className="font-semibold text-blue-700 hover:text-blue-900" to={`/tools/${detail.tool_slug}`}>
                    {detail.tool_name || detail.tool_slug}
                  </Link>
                ) : (
                  <span>{detail.tool_name || '-'}</span>
                )}
              </div>
              <div className="min-w-0 break-words">
                {pageLink ? (
                  <Link className="font-semibold text-blue-700 hover:text-blue-900" to={pageLink.href}>
                    {pageLink.label}
                  </Link>
                ) : (
                  <span>{detail.page_path}</span>
                )}
              </div>
              <span className="min-w-0 break-words">{detail.section}</span>
              <span className="min-w-0 break-words font-mono text-xs">{detail.field}</span>
              <span className="min-w-0 break-words">{detail.change_type}</span>
              <span className="min-w-0 break-words">{detail.source_titles.length > 0 ? detail.source_titles.join('、') : '-'}</span>
              {(detail.before || detail.after) && (
                <div className="min-w-0 rounded-lg bg-blue-50 p-2 text-xs leading-5 text-blue-900 md:col-span-6">
                  {detail.before && <p className="break-words">修改前：{detail.before}</p>}
                  {detail.after && <p className="break-words">修改后：{detail.after}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChangeList({ changes }: { changes: UpdateLogChange[] }) {
  if (changes.length === 0) {
    return <p className="rounded-xl bg-white p-3 text-sm text-blue-900 ring-1 ring-blue-100">本次更新没有字段级变更记录。</p>;
  }

  return (
    <div className="space-y-3">
      {changes.map((change) => (
        <div key={`${change.title}-${change.change_type}`} className="rounded-xl bg-white p-4 text-sm leading-6 text-blue-950 ring-1 ring-blue-100">
          <p className="font-semibold">{change.title}</p>
          <p className="break-words">{change.description}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <ChangeBucket label="新增" slugs={change.added_tool_slugs} className="bg-emerald-50 text-emerald-700 ring-emerald-100" />
            <ChangeBucket label="修改" slugs={change.updated_tool_slugs} className="bg-blue-50 text-blue-700 ring-blue-100" />
            <ChangeBucket label="删除" slugs={change.deleted_tool_slugs} className="bg-rose-50 text-rose-700 ring-rose-100" />
          </div>
          {change.page_paths.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {change.page_paths.map((path) => {
                const pageLink = pagePathLink(path);
                return pageLink ? (
                  <Link key={path} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900" to={pageLink.href}>
                    {pageLink.label}
                  </Link>
                ) : (
                  <span key={path} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {path}
                  </span>
                );
              })}
            </div>
          )}
          <ChangeDetailList details={change.change_details} />
        </div>
      ))}
    </div>
  );
}

function ExecutionDetails({ log }: { log: UpdateLogEntry }) {
  const [activeTab, setActiveTab] = useState<'report' | 'changes'>('report');
  const tabClassName = (tab: 'report' | 'changes') =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-950'}`;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="执行详情分类">
        <button id="execution-report-tab" type="button" role="tab" aria-selected={activeTab === 'report'} aria-controls="execution-report-panel" className={tabClassName('report')} onClick={() => setActiveTab('report')}>
          执行结果报告
        </button>
        <button id="change-details-tab" type="button" role="tab" aria-selected={activeTab === 'changes'} aria-controls="change-details-panel" className={tabClassName('changes')} onClick={() => setActiveTab('changes')}>
          具体更新内容
        </button>
      </div>
      <div className="mt-3">
        {activeTab === 'report' && (
          <div id="execution-report-panel" role="tabpanel" aria-labelledby="execution-report-tab">
            <ExecutionReportRows lines={log.execution_report} />
          </div>
        )}
        {activeTab === 'changes' && (
          <div id="change-details-panel" role="tabpanel" aria-labelledby="change-details-tab">
            <ChangeList changes={log.changes} />
          </div>
        )}
      </div>
    </div>
  );
}

function AffectedToolsLine({ log }: { log: UpdateLogEntry }) {
  const visibleTools = log.affected_tools.slice(0, 3);
  const overflow = log.affected_tools.length - visibleTools.length;

  return (
    <p className="flex flex-wrap items-center gap-1 text-sm leading-6 text-slate-600">
      <span>影响工具：{log.affected_tools.length} 个</span>
      {visibleTools.map((tool) => (
        <Link key={tool.slug} className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 hover:text-blue-900" to={`/tools/${tool.slug}`}>
          {tool.name}
        </Link>
      ))}
      {overflow > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">+{overflow}</span>}
      {log.affected_tools.length === 0 && <span>本次更新没有公开工具链接。</span>}
    </p>
  );
}

function UpdateLogArticle({ log }: { log: UpdateLogEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const logTime = formatBeijingTime(log.update_time);

  return (
    <article aria-label={`更新日志 ${logTime}`} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">{log.source}</p>
          <h2 className="mt-1 text-base font-black text-slate-950">{logTime}</h2>
          <p className="mt-1 truncate text-sm leading-5 text-slate-600">{log.summary || '内容更新记录'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusClassName(log.status)}`}>{log.status}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${validationClassName(log.validation.status)}`}>{log.validation.message}</span>
          <button className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800" type="button" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? `收起更新日志 ${logTime}` : `展开更新日志 ${logTime}`}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3">
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <h3 className="font-black text-slate-950">更新概览</h3>
            <div className="mt-2 space-y-1">
              <p className="break-words text-sm leading-6 text-slate-600">更新时间：{logTime}；资料生成：{log.generated_at || '-'}；来源：{sourceSummary(log)}</p>
              <p className="break-words text-sm leading-6 text-slate-600">验证：{log.validation.message}；敏感发现：{log.validation.sensitive_findings_count}；指南数量：{log.guide_count}</p>
              <AffectedToolsLine log={log} />
            </div>
          </div>

          <CollapsibleSection title="执行详情" summary={`${log.execution_report.length} 条报告，${log.changes.length} 条更新记录。`} tone="blue">
            <ExecutionDetails log={log} />
          </CollapsibleSection>
        </div>
      )}
    </article>
  );
}

export function UpdateLogPage() {
  const [logs, setLogs] = useState<UpdateLogEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;

    apiGet<UpdateLogEntry[]>('/api/update-logs')
      .then((data) => {
        if (!isMounted) return;
        setLogs(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('error');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const latest = logs[0];
  const successfulCount = useMemo(() => logs.filter((log) => log.status !== 'failed').length, [logs]);
  const failedCount = logs.length - successfulCount;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-blue-200">Content Audit</p>
        <h1 className="mt-1 text-2xl font-black">更新日志</h1>
        <p className="mt-1 max-w-5xl text-sm leading-6 text-slate-200">
          记录每次内容更新的来源、影响范围、验证结果和敏感扫描状态。
        </p>
      </section>

      {status === 'loading' && <p className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载更新日志...</p>}
      {status === 'error' && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 shadow-sm ring-1 ring-red-100">更新日志加载失败，请稍后重试。</p>}
      {status === 'ready' && logs.length === 0 && <p className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无更新记录。</p>}

      {status === 'ready' && logs.length > 0 && (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">最近更新时间</p>
              <p className="mt-1 text-base font-black text-slate-950">{formatBeijingTime(latest.update_time)}</p>
            </article>
            <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">日志总数</p>
              <p className="mt-1 text-base font-black text-slate-950">{logs.length}</p>
            </article>
            <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">验证结果</p>
              <p className="mt-1 text-base font-black text-slate-950">通过 {successfulCount} / 失败 {failedCount}</p>
            </article>
          </section>

          <section className="space-y-3">
            {logs.map((log) => (
              <UpdateLogArticle key={log.id} log={log} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
