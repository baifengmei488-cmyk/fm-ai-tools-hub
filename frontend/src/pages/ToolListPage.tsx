import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tool, apiGet } from '../api/client';
import { displayToolType, ToolIcon } from '../components/ToolIcon';

type ToolListStatus = 'loading' | 'error' | 'ready';

export function ToolListPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [status, setStatus] = useState<ToolListStatus>('loading');

  const toolTypes = useMemo(() => {
    const typeCounts = new Map<string, number>();

    tools.forEach((tool) => {
      const type = displayToolType(tool.type);
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    });

    return Array.from(typeCounts, ([type, count]) => ({ type, count })).sort((left, right) =>
      left.type.localeCompare(right.type),
    );
  }, [tools]);

  const filteredTools = selectedType ? tools.filter((tool) => displayToolType(tool.type) === selectedType) : tools;

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
    <div className="space-y-4">
      <section className="rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-blue-200">Tools Directory</p>
            <h1 className="mt-1 text-2xl font-black">工具库</h1>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-200">默认展示全部工具，按图标、类型和摘要快速判断该打开哪个工具指南。</p>
          </div>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-300 shadow-sm outline-none focus:ring-2 focus:ring-blue-300 lg:max-w-sm"
            placeholder="搜索工具"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      {toolTypes.length > 0 && (
        <fieldset aria-label="工具标识筛选" className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
          <legend className="sr-only">按标识筛选</legend>
          <div className="flex flex-wrap gap-1">
            <label className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ${selectedType === '' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}>
              <input type="radio" name="tool-type-filter" value="" checked={selectedType === ''} onChange={() => setSelectedType('')} className="sr-only" />
              <span>全部</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedType === '' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{tools.length}</span>
            </label>
            {toolTypes.map((toolType) => (
              <label key={toolType.type} className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ${selectedType === toolType.type ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}>
                <input type="radio" name="tool-type-filter" value={toolType.type} checked={selectedType === toolType.type} onChange={() => setSelectedType(toolType.type)} className="sr-only" />
                <span>{toolType.type}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedType === toolType.type ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{toolType.count}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {status === 'loading' && <p className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">正在加载工具...</p>}
      {status === 'error' && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 shadow-sm ring-1 ring-red-100">工具加载失败，请稍后重试。</p>}
      {status === 'ready' && filteredTools.length === 0 && <p className="rounded-xl bg-white p-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">暂无匹配工具。</p>}
      {status === 'ready' && filteredTools.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {filteredTools.map((tool) => (
            <Link key={tool.slug} to={`/tools/${tool.slug}`} className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-100">
              <div className="flex items-start gap-3">
                <ToolIcon name={tool.name} type={tool.type} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-black text-slate-950 group-hover:text-blue-700">{tool.name}</h2>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">{displayToolType(tool.type)}</span>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{tool.status}</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600">{tool.summary}</p>
              <span className="mt-3 inline-flex text-sm font-bold text-blue-700 group-hover:text-blue-900">查看指南 →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
