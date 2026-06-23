import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet } from '../api/client';

type ToolListStatus = 'loading' | 'error' | 'ready';

export function ToolListPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [status, setStatus] = useState<ToolListStatus>('loading');

  const toolTypes = useMemo(() => {
    const typeCounts = new Map<string, number>();

    tools.forEach((tool) => {
      typeCounts.set(tool.type, (typeCounts.get(tool.type) ?? 0) + 1);
    });

    return Array.from(typeCounts, ([type, count]) => ({ type, count })).sort((left, right) =>
      left.type.localeCompare(right.type),
    );
  }, [tools]);

  const filteredTools = selectedType ? tools.filter((tool) => tool.type === selectedType) : tools;

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

  useEffect(() => {
    if (selectedType && !toolTypes.some((toolType) => toolType.type === selectedType)) {
      setSelectedType('');
    }
  }, [selectedType, toolTypes]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">工具库</h1>
          <p className="mt-2 text-sm text-slate-600">默认展示全部工具，可按卡片标识快速筛选。</p>
        </div>
        <input
          className="w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm lg:max-w-xs"
          placeholder="搜索工具"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {toolTypes.length > 0 && (
        <fieldset className="mb-5" aria-label="工具标识筛选">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">按标识筛选</legend>
          <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <label
              className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                selectedType === ''
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <input
                type="radio"
                name="tool-type-filter"
                value=""
                checked={selectedType === ''}
                onChange={() => setSelectedType('')}
                className="sr-only"
              />
              <span>全部</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  selectedType === '' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'
                }`}
              >
                {tools.length}
              </span>
            </label>
            {toolTypes.map((toolType) => (
              <label
                key={toolType.type}
                className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  selectedType === toolType.type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <input
                  type="radio"
                  name="tool-type-filter"
                  value={toolType.type}
                  checked={selectedType === toolType.type}
                  onChange={() => setSelectedType(toolType.type)}
                  className="sr-only"
                />
                <span>{toolType.type}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    selectedType === toolType.type ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'
                  }`}
                >
                  {toolType.count}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {status === 'loading' && <p className="text-slate-600">正在加载工具...</p>}
      {status === 'error' && <p className="text-slate-600">工具加载失败，请稍后重试。</p>}
      {status === 'ready' && filteredTools.length === 0 && <p className="text-slate-600">暂无匹配工具。</p>}
      {status === 'ready' && filteredTools.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {filteredTools.map((tool) => (
            <Link key={tool.slug} to={`/tools/${tool.slug}`} className="rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-slate-950">{tool.name}</h2>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs">{tool.type}</span>
              </div>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">{tool.summary}</p>
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
