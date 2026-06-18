import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet } from '../api/client';

type ToolListStatus = 'loading' | 'error' | 'ready';

export function ToolListPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ToolListStatus>('loading');

  useEffect(() => {
    let isActive = true;
    const path = query ? `/api/tools?q=${encodeURIComponent(query)}` : '/api/tools';

    setStatus('loading');

    apiGet<Tool[]>(path)
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
  }, [query]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">工具库</h1>
        <input
          className="rounded-lg border px-3 py-2"
          placeholder="搜索工具"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {status === 'loading' && <p className="text-slate-600">正在加载工具...</p>}
      {status === 'error' && <p className="text-slate-600">工具加载失败，请稍后重试。</p>}
      {status === 'ready' && tools.length === 0 && <p className="text-slate-600">暂无公开工具。</p>}
      {status === 'ready' && tools.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <Link key={tool.slug} to={`/tools/${tool.slug}`} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-950">{tool.name}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{tool.type}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{tool.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <span key={tag.slug} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">{tag.name}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
