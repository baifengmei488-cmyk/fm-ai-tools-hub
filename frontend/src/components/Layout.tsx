import { Link, NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/tools', label: '工具库' },
  { to: '/workflows', label: '工作流' },
  { to: '/guides', label: '使用指南' },
  { to: '/updates', label: '更新日志' },
  { to: '/login', label: '后台登录' },
];

export function Layout() {
  return (
    <div className="min-h-screen" data-testid="compact-toolvault-shell">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
          <Link to="/" className="flex items-center gap-2 text-sm font-black text-slate-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-xs text-white">FM</span>
            <span>AI Tools Hub</span>
          </Link>
          <nav className="flex flex-wrap justify-end gap-1 text-sm" aria-label="主导航">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1.5 font-semibold transition ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-5 lg:py-5">
        <Outlet />
      </main>
    </div>
  );
}
