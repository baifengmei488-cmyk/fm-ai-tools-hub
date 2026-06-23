import { Link } from 'react-router-dom';

const toolSlugs: Record<string, string> = {
  'Claude Code': 'claude-code',
  'Firecrawl MCP': 'firecrawl-mcp',
  'Frontend Design plugin': 'frontend-design',
  'GitHub MCP': 'github-mcp',
  'MySQL MCP': 'mysql-mcp',
  OpenSpec: 'openspec',
  PicGo: 'picgo',
  'Playwright MCP': 'playwright-mcp',
  'Skill Creator plugin': 'skill-creator',
  'Spec Kit': 'spec-kit',
  'Superpowers Skills': 'superpowers-skills',
  'Time MCP': 'time-mcp',
  uv: 'uv',
};

type ToolLinkProps = {
  name: string;
  className?: string;
};

const defaultClassName = 'font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-900';

export function getToolHref(name: string) {
  const slug = toolSlugs[name];
  return slug ? `/tools/${slug}` : undefined;
}

export function ToolLink({ name, className = defaultClassName }: ToolLinkProps) {
  const href = getToolHref(name);

  if (!href) {
    return <span>{name}</span>;
  }

  return (
    <Link className={className} to={href}>
      {name}
    </Link>
  );
}

export function ToolPillLink({ name }: ToolLinkProps) {
  return (
    <ToolLink
      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
      name={name}
    />
  );
}
