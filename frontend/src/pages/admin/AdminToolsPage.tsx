import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet, getStoredToken } from '../../api/client';
import { displayToolType, ToolIcon } from '../../components/ToolIcon';

type AdminToolsStatus = 'loading' | 'error' | 'unauthenticated' | 'ready';

export function AdminToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [status, setStatus] = useState<AdminToolsStatus>('loading');

  useEffect(() => {
    let isActive = true;
    const token = getStoredToken();

    if (!token) {
      setTools([]);
      setStatus('unauthenticated');
      return () => {
        isActive = false;
      };
    }

    setStatus('loading');

    apiGet<Tool[]>('/api/admin/tools', token)
      .then((loadedTools) => {
        if (!isActive) {
          return;
        }
        setTools(loadedTools);
        setStatus('ready');
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setTools([]);
        setStatus('error');
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">Admin Tools</p>
            <h1 className="text-2xl font-black">后台工具管理</h1>
            <p className="mt-1 text-sm text-slate-600">查看公开和登录可见的工具条目。</p>
          </div>
          <Link className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white" to="/admin/imports">导入 JSON</Link>
        </div>
      </section>

      {status === 'loading' && <p className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载后台工具...</p>}
      {status === 'unauthenticated' && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-700">请先登录后台，再查看工具管理列表。</p>
          <Link className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white" to="/login">前往登录</Link>
        </div>
      )}
      {status === 'error' && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 shadow-sm ring-1 ring-red-100">后台工具加载失败，请检查登录状态后重试。</p>}
      {status === 'ready' && tools.length === 0 && <p className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无工具，可先导入 Claude JSON。</p>}
      {status === 'ready' && tools.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          {tools.map((tool) => (
            <div key={tool.slug} className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <ToolIcon name={tool.name} type={tool.type} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{tool.name}</p>
                  <p className="text-sm text-slate-500">{displayToolType(tool.type)} · {tool.visibility}</p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{tool.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
