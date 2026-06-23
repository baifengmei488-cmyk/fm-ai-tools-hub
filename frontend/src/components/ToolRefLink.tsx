import { Link } from 'react-router-dom';
import type { ToolReference } from '../api/client';

type ToolRefLinkProps = {
  tool: ToolReference;
  className?: string;
};

const defaultClassName = 'font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-900';

export function ToolRefLink({ tool, className = defaultClassName }: ToolRefLinkProps) {
  if (!tool.slug) {
    return <span>{tool.name}</span>;
  }

  return (
    <Link className={className} to={`/tools/${tool.slug}`}>
      {tool.name}
    </Link>
  );
}

export function ToolRefPillLink({ tool }: { tool: ToolReference }) {
  return (
    <ToolRefLink
      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
      tool={tool}
    />
  );
}
