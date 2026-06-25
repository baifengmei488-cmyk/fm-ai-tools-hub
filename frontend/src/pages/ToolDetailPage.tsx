import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { Guide, Tool, apiGet } from '../api/client';
import { displayToolType, ToolIcon } from '../components/ToolIcon';

type ToolDetailStatus = 'loading' | 'error' | 'not-found' | 'ready';
type HeadingDepth = 1 | 2 | 3;

type GuideHeading = {
  id: string;
  guideId: number;
  depth: HeadingDepth;
  text: string;
};

function isNotFoundError(error: unknown) {
  return error instanceof Error && error.message.includes('Request failed: 404');
}

function textFromChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(textFromChildren).join('');
  }
  return '';
}

function slugifyHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`*_~()[\]]/g, '')
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function stripMarkdown(value: string): string {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~]/g, '')
    .trim();
}

function isGuideTitleHeading(text: string, guide: Guide, toolName: string) {
  return text === guide.title || text === `${guide.title} 使用指南` || text === `${toolName} 使用指南`;
}

function buildGuideHeadings(guides: Guide[], toolName: string): GuideHeading[] {
  const usedIds = new Map<string, number>();

  return guides.flatMap((guide) => {
    const headings: GuideHeading[] = [];
    const headingPattern = /^(#{1,3})\s+(.+)$/gm;
    let match: RegExpExecArray | null;

    while ((match = headingPattern.exec(guide.content_markdown)) !== null) {
      const text = stripMarkdown(match[2]);
      if (isGuideTitleHeading(text, guide, toolName)) {
        continue;
      }
      const baseId = `${guide.id}-${slugifyHeading(text)}`;
      const seenCount = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, seenCount + 1);
      headings.push({
        id: seenCount === 0 ? baseId : `${baseId}-${seenCount + 1}`,
        guideId: guide.id,
        depth: match[1].length as HeadingDepth,
        text,
      });
    }

    return headings;
  });
}

function headingClassName(depth: HeadingDepth): string {
  if (depth === 1) {
    return 'scroll-mt-20 border-b border-slate-200 pb-3 text-2xl font-black tracking-tight text-slate-950';
  }
  if (depth === 2) {
    return 'scroll-mt-20 pt-5 text-xl font-bold tracking-tight text-slate-950';
  }
  return 'scroll-mt-20 pt-3 text-lg font-bold text-slate-900';
}

function GuideMarkdown({ guide, headings, toolName }: { guide: Guide; headings: GuideHeading[]; toolName: string }) {
  let headingIndex = 0;
  const guideHeadings = headings.filter((heading) => heading.guideId === guide.id);

  function renderHeading(depth: HeadingDepth, children: ReactNode) {
    const heading = guideHeadings[headingIndex];
    headingIndex += 1;
    const id = heading?.id ?? `${guide.id}-${slugifyHeading(textFromChildren(children))}`;
    const headingText = textFromChildren(children).trim();

    if (isGuideTitleHeading(headingText, guide, toolName)) {
      return <span id={id} className="block scroll-mt-24" aria-hidden="true" />;
    }

    const className = headingClassName(depth);

    if (depth === 1) {
      return <h1 id={id} className={className}>{children}</h1>;
    }
    if (depth === 2) {
      return <h2 id={id} className={className}>{children}</h2>;
    }
    return <h3 id={id} className={className}>{children}</h3>;
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        h1: ({ children }) => renderHeading(1, children),
        h2: ({ children }) => renderHeading(2, children),
        h3: ({ children }) => renderHeading(3, children),
        p: ({ children }) => <p className="text-sm leading-7 text-slate-700">{children}</p>,
        ul: ({ children }) => <ul className="space-y-1.5 pl-5 text-sm text-slate-700 marker:text-blue-500">{children}</ul>,
        ol: ({ children }) => <ol className="space-y-1.5 pl-5 text-sm text-slate-700 marker:font-semibold marker:text-blue-600">{children}</ol>,
        li: ({ children }) => <li className="pl-1 leading-6">{children}</li>,
        pre: ({ children }) => <pre className="whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-100 shadow-inner">{children}</pre>,
        code: ({ children }) => <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-sm font-semibold text-slate-800">{children}</code>,
        a: ({ children, href }) => <a href={href} className="font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:text-blue-900">{children}</a>,
        strong: ({ children }) => <strong className="font-bold text-slate-950">{children}</strong>,
        blockquote: ({ children }) => <blockquote className="rounded-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm text-slate-700">{children}</blockquote>,
        hr: () => <hr className="my-5 border-slate-200" />,
        table: ({ children }) => <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-left text-sm">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">{children}</thead>,
        tbody: ({ children }) => <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>,
        th: ({ children }) => <th className="px-3 py-2 font-bold text-slate-700">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 leading-6 text-slate-700">{children}</td>,
      }}
    >
      {guide.content_markdown}
    </ReactMarkdown>
  );
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

  const headings = useMemo(() => (tool ? buildGuideHeadings(tool.guides, tool.name) : []), [tool]);

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
    <article className="space-y-4">
      <section className="rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-sm">
        <div className="flex items-start gap-3">
          <ToolIcon name={tool.name} type={tool.type} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-blue-100 ring-1 ring-white/15">{displayToolType(tool.type)}</span>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-bold text-emerald-100 ring-1 ring-emerald-300/20">{tool.status}</span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">{tool.name}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-200">{tool.summary}</p>
          </div>
        </div>
      </section>

      <div className={`grid gap-4 ${headings.length > 0 ? 'lg:grid-cols-[15rem_minmax(0,1fr)]' : ''}`}>
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav aria-label="指南目录" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="px-2 text-sm font-black text-slate-950">指南目录</p>
            <div className="mt-2 space-y-0.5">
              <a href="#tool-quick-reference" className="block rounded-lg px-2 py-1.5 text-sm font-bold text-slate-900 transition hover:bg-blue-50 hover:text-blue-700">工具速查</a>
              {(tool.install_command || tool.verify_command) && <a href="#tool-install-verify" className="block rounded-lg px-2 py-1.5 text-sm font-bold text-slate-900 transition hover:bg-blue-50 hover:text-blue-700">安装与验证</a>}
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={`block rounded-lg px-2 py-1.5 text-sm leading-5 transition hover:bg-blue-50 hover:text-blue-700 ${
                    heading.depth === 1
                      ? 'font-bold text-slate-900'
                      : heading.depth === 2
                        ? 'ml-3 text-slate-600'
                        : 'ml-6 text-slate-500'
                  }`}
                >
                  {heading.text}
                </a>
              ))}
            </div>
          </nav>
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">Documentation</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">工具使用指南</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{tool.guides.length} 篇指南</span>
          </div>

          <div id="tool-quick-reference" className="scroll-mt-20 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <h3 className="text-base font-black text-slate-950">工具速查</h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-xs font-bold text-slate-500">类型</dt><dd className="font-semibold text-slate-950">{displayToolType(tool.type)}</dd></div>
              <div><dt className="text-xs font-bold text-slate-500">状态</dt><dd className="font-semibold text-slate-950">{tool.status}</dd></div>
              <div><dt className="text-xs font-bold text-slate-500">可见性</dt><dd className="font-semibold text-slate-950">{tool.visibility}</dd></div>
              <div><dt className="text-xs font-bold text-slate-500">指南</dt><dd className="font-semibold text-slate-950">{tool.guides.length} 篇</dd></div>
            </dl>
            {(tool.categories.length > 0 || tool.tags.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {tool.categories.map((category) => <span key={category.slug} className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 ring-1 ring-blue-100">{category.name}</span>)}
                {tool.tags.map((tag) => <span key={tag.slug} className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">#{tag.name}</span>)}
              </div>
            )}
          </div>

          {(tool.install_command || tool.verify_command) && (
            <div id="tool-install-verify" className="mt-3 scroll-mt-20 rounded-xl bg-slate-950 p-3 text-slate-100">
              <h3 className="text-base font-black text-white">安装与验证</h3>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {tool.install_command && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">安装命令</p><pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-white/5 p-3 text-sm leading-6">{tool.install_command}</pre></div>}
                {tool.verify_command && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">验证命令</p><pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-white/5 p-3 text-sm leading-6">{tool.verify_command}</pre></div>}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-5">
            {tool.guides.map((guide) => (
              <section key={guide.id} className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{guide.guide_type}</p>
                    <h2 className="mt-1 text-xl font-black text-slate-950">{guide.title}</h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{guide.visibility}</span>
                </div>
                <div className="space-y-4">
                  <GuideMarkdown guide={guide} headings={headings} toolName={tool.name} />
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </article>
  );
}
