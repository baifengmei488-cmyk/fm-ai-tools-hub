import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Tool, apiGet } from '../api/client';

type ToolDetailStatus = 'loading' | 'error' | 'not-found' | 'ready';

function isNotFoundError(error: unknown) {
  return error instanceof Error && error.message.includes('Request failed: 404');
}

export function ToolDetailPage() {
  const { slug } = useParams();
  const [tool, setTool] = useState<Tool | null>(null);
  const [status, setStatus] = useState<ToolDetailStatus>('loading');

  useEffect(() => {
    let isActive = true;

    if (!slug) {
      setTool(null);
      setStatus('not-found');
      return () => {
        isActive = false;
      };
    }

    setTool(null);
    setStatus('loading');

    apiGet<Tool>(`/api/tools/${slug}`)
      .then((loadedTool) => {
        if (!isActive) {
          return;
        }
        setTool(loadedTool);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }
        setTool(null);
        setStatus(isNotFoundError(error) ? 'not-found' : 'error');
      });

    return () => {
      isActive = false;
    };
  }, [slug]);

  if (status === 'loading') {
    return <p className="text-slate-600">正在加载工具...</p>;
  }

  if (status === 'error') {
    return <p className="text-slate-600">工具加载失败，请稍后重试。</p>;
  }

  if (status === 'not-found' || !tool) {
    return <p className="text-slate-600">未找到公开工具。</p>;
  }

  return (
    <article className="rounded-2xl bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{tool.name}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{tool.status}</span>
      </div>
      <p className="mt-4 text-slate-600">{tool.summary}</p>
      {tool.install_command && <pre className="mt-4 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-white">{tool.install_command}</pre>}
      {tool.guides.map((guide) => (
        <section key={guide.id} className="prose mt-8 max-w-none">
          <h2>{guide.title}</h2>
          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{guide.content_markdown}</ReactMarkdown>
        </section>
      ))}
    </article>
  );
}
