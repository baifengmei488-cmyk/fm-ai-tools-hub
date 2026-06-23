import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, type UpdateLogEntry } from '../api/client';

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
          记录 ToolVault 每次内容更新的来源、更新时间、影响范围和验证结果，方便回看每天自动更新是否安全、完整、可追踪。
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
              <p className="mt-2 text-lg font-bold text-slate-950">{new Date(latest.update_time).toLocaleString()}</p>
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
              <article key={log.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">{log.source}</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950">{log.summary || '内容更新记录'}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">更新时间：{new Date(log.update_time).toLocaleString()}</p>
                    {log.generated_at && <p className="text-sm leading-6 text-slate-600">资料生成时间：{log.generated_at}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClassName(log.status)}`}>{log.status}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${validationClassName(log.validation.status)}`}>{log.validation.message}</span>
                  </div>
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

                {log.changes.length > 0 && (
                  <section className="mt-5 rounded-xl bg-blue-50 p-4">
                    <h3 className="font-bold text-slate-950">具体更新内容</h3>
                    <div className="mt-3 space-y-3">
                      {log.changes.map((change) => (
                        <div key={`${change.title}-${change.change_type}`} className="text-sm leading-6 text-blue-950">
                          <p className="font-semibold">{change.title}</p>
                          <p>{change.description}</p>
                          {change.page_paths.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {change.page_paths.map((path) => (
                                <Link key={path} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900" to={path}>
                                  {path}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
