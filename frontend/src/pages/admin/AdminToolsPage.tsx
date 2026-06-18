import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet, getStoredToken } from '../../api/client';

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
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">后台工具管理</h1>
          <p className="mt-1 text-sm text-slate-600">查看公开和登录可见的工具条目。</p>
        </div>
        <Link className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white" to="/admin/imports">导入 JSON</Link>
      </div>

      {status === 'loading' && <p className="text-slate-600">正在加载后台工具...</p>}
      {status === 'unauthenticated' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-slate-700">请先登录后台，再查看工具管理列表。</p>
          <Link className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white" to="/login">前往登录</Link>
        </div>
      )}
      {status === 'error' && <p className="text-slate-600">后台工具加载失败，请检查登录状态后重试。</p>}
      {status === 'ready' && tools.length === 0 && <p className="text-slate-600">暂无工具，可先导入 Claude JSON。</p>}
      {status === 'ready' && tools.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm">
          {tools.map((tool) => (
            <div key={tool.slug} className="flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{tool.name}</p>
                <p className="text-sm text-slate-500">{tool.type} · {tool.visibility}</p>
              </div>
              <span className="text-sm text-slate-500">{tool.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
