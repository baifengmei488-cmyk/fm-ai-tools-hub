type ToolIconProps = {
  name: string;
  type: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const typeStyles: Record<string, string> = {
  mcp: 'from-blue-600 to-cyan-500 text-white ring-blue-200',
  mcp_server: 'from-blue-600 to-cyan-500 text-white ring-blue-200',
  cli: 'from-slate-900 to-slate-700 text-white ring-slate-300',
  skill: 'from-violet-600 to-fuchsia-500 text-white ring-violet-200',
  plugin: 'from-emerald-600 to-teal-500 text-white ring-emerald-200',
  desktop_app: 'from-orange-500 to-amber-400 text-white ring-orange-200',
};

const sizeClasses = {
  sm: 'h-8 w-8 rounded-xl text-[10px]',
  md: 'h-10 w-10 rounded-2xl text-xs',
  lg: 'h-12 w-12 rounded-2xl text-sm',
};

const knownMarks: Record<string, string> = {
  'claude-code': 'CC',
  'context7-mcp': 'C7',
  'firecrawl-mcp': 'FC',
  'frontend-design': 'FD',
  'github-mcp': 'GH',
  'mysql-mcp': 'SQL',
  openspec: 'OS',
  picgo: 'PG',
  'playwright-mcp': 'PW',
  'skill-creator': 'SC',
  'spec-kit': 'SK',
  'superpowers-skills': 'SP',
  'time-mcp': 'TM',
  uv: 'uv',
};

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function fallbackMark(name: string, type: string) {
  if (type === 'cli') return '>$';
  if (type === 'mcp' || type === 'mcp_server') return 'MCP';
  if (type === 'desktop_app') return 'APP';

  const asciiWords = name.match(/[A-Za-z0-9]+/g) ?? [];
  const mark = asciiWords.slice(0, 2).map((word) => word[0]).join('');
  return mark || name.slice(0, 2).toUpperCase();
}

export function displayToolType(type: string) {
  return type === 'mcp' ? 'mcp_server' : type;
}

export function ToolIcon({ name, type, className = '', size = 'md' }: ToolIconProps) {
  const displayType = displayToolType(type);
  const slug = slugify(name);
  const mark = knownMarks[slug] ?? fallbackMark(name, displayType);
  const typeClass = typeStyles[displayType] ?? 'from-slate-500 to-slate-400 text-white ring-slate-200';

  return (
    <span
      aria-label={`${name} 工具图标`}
      className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br font-black tracking-tight shadow-sm ring-1 ${sizeClasses[size]} ${typeClass} ${className}`}
      role="img"
    >
      {mark}
    </span>
  );
}
