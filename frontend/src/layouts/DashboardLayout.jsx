import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, LayoutGrid, LogOut, Server } from 'lucide-react';
import { MetricsProvider } from '../hooks/useMetricsHistory';
import CommandPalette from '../components/CommandPalette';

const DashboardLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  return (
    <MetricsProvider>
      <CommandPalette />
      <div className="min-h-screen bg-[var(--color-dark-bg)] text-[var(--color-dark-text)] flex flex-col">
      <header className="bg-[var(--color-dark-surface)] border-b border-[var(--color-dark-border)] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Server className="w-6 h-6 text-emerald-500" />
          <h1 className="text-xl font-semibold tracking-tight">System Ops Portal</h1>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                  : 'text-[var(--color-dark-muted)] hover:bg-[var(--color-dark-border)] hover:text-white'
              }`
            }
          >
            <LayoutGrid className="h-4 w-4" />
            Overview
          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                  : 'text-[var(--color-dark-muted)] hover:bg-[var(--color-dark-border)] hover:text-white'
              }`
            }
          >
            <BarChart3 className="h-4 w-4" />
            Stats
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 rounded-md px-3 py-1.5 text-sm text-[var(--color-dark-muted)] transition-colors hover:bg-[var(--color-dark-border)] hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col">
        <Outlet />
      </main>
      </div>
    </MetricsProvider>
  );
};

export default DashboardLayout;
