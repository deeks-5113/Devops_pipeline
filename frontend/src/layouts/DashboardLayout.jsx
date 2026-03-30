import { Outlet, useNavigate } from 'react-router-dom';
import { Server, LogOut } from 'lucide-react';
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
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-sm text-[var(--color-dark-muted)] hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-[var(--color-dark-border)]"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 flex flex-col">
        <Outlet />
      </main>
      </div>
    </MetricsProvider>
  );
};

export default DashboardLayout;
