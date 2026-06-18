import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Tool, apiGet } from '../api/client';

export function ToolDetailPage() {
  const { slug } = useParams();
  const [tool, setTool] = useState<Tool | null>(null);

  useEffect(() => {
    if (slug) {
      apiGet<Tool>(`/api/tools/${slug}`).then(setTool).catch(() => setTool(null));
    }
  }, [slug]);

  if (!tool) {
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
