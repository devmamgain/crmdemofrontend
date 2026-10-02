import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Calculator, BarChart3, Sparkles, Settings, Menu, X, Bell } from 'lucide-react';
import { getHealth } from '../services/api.js';
import { Avatar } from '../components/ui.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Client Leads', icon: Users },
  { to: '/deals', label: 'Deals Pipeline', icon: Briefcase },
  { to: '/fmv', label: 'Asset Valuation (FMV)', icon: Calculator },
  { to: '/reports', label: 'Sales Reports', icon: BarChart3 },
  // { to: '/ai-leads', label: 'AI Prospecting', icon: Sparkles },
];
const TITLES = { '/': 'Dashboard', '/leads': 'Client Leads', '/deals': 'Deals Pipeline', '/fmv': 'Asset Valuation (FMV)', '/reports': 'Sales Reports', '/ai-leads': 'AI Prospecting', '/settings': 'Settings' };

function ApiStatus() {
  const [health, setHealth] = useState(null);
  useEffect(() => {
    let alive = true;
    const check = () => getHealth().then((h) => alive && setHealth(h)).catch(() => alive && setHealth({ down: true }));
    check();
    const t = setInterval(check, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  const state = !health ? ['bg-slate-300', 'Checking API…'] : health.down ? ['bg-red-500', 'API offline'] : !health.db.connected ? ['bg-amber-500', 'Database offline'] : ['bg-emerald-500', 'API online'];
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500" role="status">
      <span className={`h-2 w-2 rounded-full ${state[0]}`} />{state[1]}
    </div>
  );
}

function Sidebar({ onNavigate }) {
  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">B</span>
        <span className="leading-tight"><span className="block text-sm font-semibold tracking-tight">Baytech Recovery</span><span className="block text-[11px] text-slate-500">Asset Value Recovery</span></span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={link} onClick={onNavigate}>
            <Icon className="h-4 w-4" aria-hidden="true" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-slate-200 p-3">
        <NavLink to="/settings" className={link} onClick={onNavigate}><Settings className="h-4 w-4" aria-hidden="true" />Settings</NavLink>
        <ApiStatus />
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white lg:block"><Sidebar /></aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl"><Sidebar onNavigate={() => setOpen(false)} /></aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="btn-ghost !px-2 lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-sm font-semibold text-slate-900">{TITLES[pathname] || 'Baytech Recovery'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-ghost !px-2" aria-label="Notifications"><Bell className="h-4 w-4" /></button>
            <div className="flex items-center gap-2"><Avatar name="Baytech Sales" size="md" /><span className="hidden text-sm text-slate-700 sm:block">Sales Team (demo)</span></div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
