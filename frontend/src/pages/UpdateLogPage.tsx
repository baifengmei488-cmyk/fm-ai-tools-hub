import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, type UpdateLogChangeDetail, type UpdateLogContentPlanItem, type UpdateLogEntry } from '../api/client';

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

function linkablePagePath(path: string) {
  return path.startsWith('/') && !path.includes('{') ? path : undefined;
}

function CollapsibleSection({ title, summary, tone = 'slate', children }: { title: string; summary: string; tone?: 'slate' | 'blue'; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerClassName = tone === 'blue' ? 'mt-5 rounded-xl bg-blue-50 p-4' : 'mt-5 rounded-xl bg-slate-50 p-4';
  const buttonClassName = tone === 'blue' ? 'text-blue-700 hover:text-blue-900' : 'text-slate-700 hover:text-slate-950';

  return (
    <section className={containerClassName}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
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

function ContentPlanChecklist({ items = [] }: { items?: UpdateLogContentPlanItem[] }) {
  if (items.length === 0) return null;

  const grouped = items.reduce<Record<string, UpdateLogContentPlanItem[]>>((groups, item) => {
    groups[item.page_path] = [...(groups[item.page_path] ?? []), item];
    return groups;
  }, {});

  return (
      <div className="grid gap-3 lg:grid-cols-2">
        {Object.entries(grouped).map(([pagePath, pageItems]) => (
          <div key={pagePath} className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-950">{pageItems[0].page_name}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{pagePath}</span>
            </div>
            <div className="mt-3 space-y-3">
              {pageItems.map((item) => (
                <div key={`${item.page_path}-${item.section}`} className="text-sm leading-6 text-slate-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-950">{item.section}</span>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">{item.status}</span>
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {item.required_content.map((content) => (
                      <li key={content}>{content}</li>
                    ))}
                  </ul>
                  {item.tool_slugs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.tool_slugs.map((slug) => (
                        <Link key={`${item.page_path}-${item.section}-${slug}`} className="rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:text-blue-900" to={`/tools/${slug}`}>
                          {slug}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
  );
}

function ChangeDetailList({ details = [] }: { details?: UpdateLogChangeDetail[] }) {
  if (details.length === 0) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-blue-100">
      <div className="grid gap-0 bg-blue-100/60 px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-900 md:grid-cols-[1.2fr_1.2fr_0.8fr_1fr_0.8fr_1fr]">
        <span>工具</span>
        <span>页面</span>
        <span>栏目</span>
        <span>字段</span>
        <span>动作</span>
        <span>来源</span>
      </div>
      <div className="divide-y divide-blue-100">
        {details.map((detail) => {
          const pageTo = linkablePagePath(detail.page_path);
          return (
            <div key={`${detail.tool_slug}-${detail.page_path}-${detail.section}-${detail.field}-${detail.change_type}`} className="grid gap-2 px-3 py-3 text-sm leading-6 text-blue-950 md:grid-cols-[1.2fr_1.2fr_0.8fr_1fr_0.8fr_1fr]">
              <div>
                {detail.tool_slug ? (
                  <Link className="font-semibold text-blue-700 hover:text-blue-900" to={`/tools/${detail.tool_slug}`}>
                    {detail.tool_name || detail.tool_slug}
                  </Link>
                ) : (
                  <span>{detail.tool_name || '-'}</span>
                )}
              </div>
              <div>
                {pageTo ? (
                  <Link className="font-semibold text-blue-700 hover:text-blue-900" to={pageTo}>
                    {detail.page_path}
                  </Link>
                ) : (
                  <span>{detail.page_path}</span>
                )}
              </div>
              <span>{detail.section}</span>
              <span className="break-all font-mono text-xs">{detail.field}</span>
              <span>{detail.change_type}</span>
              <span>{detail.source_titles.length > 0 ? detail.source_titles.join('、') : '-'}</span>
              {(detail.before || detail.after) && (
                <div className="rounded-lg bg-blue-50 p-2 text-xs leading-5 text-blue-900 md:col-span-6">
                  {detail.before && <p>修改前：{detail.before}</p>}
                  {detail.after && <p>修改后：{detail.after}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpdateLogArticle({ log }: { log: UpdateLogEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const logTime = formatBeijingTime(log.update_time);

  return (
    <article aria-label={`更新日志 ${logTime}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{log.source}</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950">{logTime}</h2>
          <p className="mt-1 truncate text-sm leading-6 text-slate-600">{log.summary || '内容更新记录'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName(log.status)}`}>{log.status}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${validationClassName(log.validation.status)}`}>{log.validation.message}</span>
          <button className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800" type="button" onClick={() => setIsOpen((current) => !current)}>
            {isOpen ? `收起更新日志 ${logTime}` : `展开更新日志 ${logTime}`}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <h3 className="font-bold text-slate-950">更新概览</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">更新时间：{logTime}</p>
            {log.generated_at && <p className="text-sm leading-6 text-slate-600">资料生成时间：{log.generated_at}</p>}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold text-slate-950">来源</h3>
              <div className="mt-3 space-y-3">
                {log.sources.length === 0 && <p className="text-sm text-slate-600">本次更新未记录外部来源。</p>}
                {log.sources.map((source) => (
                  <div key={`${source.title}-${source.checked_at}`} className="text-sm leading-6 text-slate-700">
                    <p className="font-semibold text-slate-950">{source.title}</p>
                    <p>类型：{source.source_type}</p>
                    <p>检查时间：{source.checked_at}</p>
                    {source.url && <a className="text-blue-700 hover:text-blue-900" href={source.url} rel="noreferrer" target="_blank">查看来源</a>}
                    {source.note && <p>{source.note}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-bold text-slate-950">验证和影响范围</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">敏感信息发现数：{log.validation.sensitive_findings_count}</p>
              <p className="text-sm leading-6 text-slate-700">指南数量：{log.guide_count}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {log.affected_tools.length === 0 && <span className="text-sm text-slate-600">本次更新没有公开工具链接。</span>}
                {log.affected_tools.map((tool) => (
                  <Link key={tool.slug} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 hover:text-blue-900" to={`/tools/${tool.slug}`}>
                    {tool.name}
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {log.content_plan.length > 0 && (
            <CollapsibleSection title="执行前页面内容清单" summary={`${log.content_plan.length} 项页面内容检查，展开查看每个页面和栏目要求。`}>
              <ContentPlanChecklist items={log.content_plan} />
            </CollapsibleSection>
          )}

          {log.execution_report.length > 0 && (
            <CollapsibleSection title="执行结果报告" summary={`${log.execution_report.length} 条执行结果、验证摘要和质量结论。`}>
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {log.execution_report.map((line) => (
                  <li key={line} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
                    {line}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {log.changes.length > 0 && (
            <CollapsibleSection title="具体更新内容" summary={`${log.changes.length} 条更新记录，展开查看新增/修改/删除、页面路径和字段级变更。`} tone="blue">
              <div className="space-y-3">
                {log.changes.map((change) => (
                  <div key={`${change.title}-${change.change_type}`} className="text-sm leading-6 text-blue-950">
                    <p className="font-semibold">{change.title}</p>
                    <p>{change.description}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <ChangeBucket label="新增" slugs={change.added_tool_slugs} className="bg-emerald-50 text-emerald-700 ring-emerald-100" />
                      <ChangeBucket label="修改" slugs={change.updated_tool_slugs} className="bg-blue-50 text-blue-700 ring-blue-100" />
                      <ChangeBucket label="删除" slugs={change.deleted_tool_slugs} className="bg-rose-50 text-rose-700 ring-rose-100" />
                    </div>
                    {change.page_paths.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {change.page_paths.map((path) => {
                          const pageTo = linkablePagePath(path);
                          return pageTo ? (
                            <Link key={path} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900" to={pageTo}>
                              {path}
                            </Link>
                          ) : (
                            <span key={path} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700">
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
            </CollapsibleSection>
          )}
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
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">Content Audit</p>
        <h1 className="mt-3 text-3xl font-bold">更新日志</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">
          记录 FM AI Tools Hub 每次内容更新的来源、更新时间、影响范围和验证结果，方便回看每天自动更新是否安全、完整、可追踪。
        </p>
      </section>

      {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载更新日志...</p>}
      {status === 'error' && <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 shadow-sm ring-1 ring-red-100">更新日志加载失败，请稍后重试。</p>}
      {status === 'ready' && logs.length === 0 && <p className="rounded-2xl bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无更新记录。</p>}

      {status === 'ready' && logs.length > 0 && (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-500">最近更新时间</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{formatBeijingTime(latest.update_time)}</p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-500">日志总数</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{logs.length}</p>
            </article>
            <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-500">验证结果</p>
              <p className="mt-2 text-lg font-bold text-slate-950">通过 {successfulCount} / 失败 {failedCount}</p>
            </article>
          </section>

          <section className="space-y-4">
            {logs.map((log) => (
              <UpdateLogArticle key={log.id} log={log} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
