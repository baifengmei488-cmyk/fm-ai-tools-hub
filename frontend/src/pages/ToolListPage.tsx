import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet } from '../api/client';

export function ToolListPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const path = query ? `/api/tools?q=${encodeURIComponent(query)}` : '/api/tools';
    apiGet<Tool[]>(path).then(setTools).catch(() => setTools([]));
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
    </div>
  );
}
