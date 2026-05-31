import { Activity, Cpu, HardDrive, Image as ImageIcon, MemoryStick, RefreshCw } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useMetricsHistory } from '../hooks/useMetricsHistory';

const StatCard = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-2xl border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-dark-muted)]">{label}</p>
        <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      </div>
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
        <Icon className="h-5 w-5 text-emerald-400" />
      </div>
    </div>
    {hint ? <p className="mt-3 text-xs font-mono text-[var(--color-dark-muted)]">{hint}</p> : null}
  </div>
);

const StatsTab = ({ to, label }) => (
  <NavLink
    to={to}
    end
    className={({ isActive }) =>
      `rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
          : 'text-[var(--color-dark-muted)] hover:bg-[var(--color-dark-border)] hover:text-white'
      }`
    }
  >
    {label}
  </NavLink>
);

const Stats = () => {
  const { systemMetrics, allStats, dockerImages, dockerStorage, isFetching, forceFetch } = useMetricsHistory();

  const imageSummary = dockerStorage.find((row) => row.type === 'Images');
  const buildCacheSummary = dockerStorage.find((row) => row.type === 'Build Cache');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.28em] text-emerald-400">Docker Telemetry</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Stats</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-dark-muted)]">
            Live container performance, image footprint, and Docker storage usage from the host daemon.
          </p>
        </div>
        <button
          onClick={forceFetch}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-dark-border)] px-4 py-2.5 text-sm text-[var(--color-dark-muted)] transition-colors hover:bg-[var(--color-dark-border)] hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Cpu} label="Host CPU" value={`${systemMetrics.cpu_percent?.toFixed?.(1) ?? '0.0'}%`} />
        <StatCard icon={MemoryStick} label="Host RAM" value={`${systemMetrics.ram_percent?.toFixed?.(1) ?? '0.0'}%`} />
        <StatCard icon={Activity} label="Containers" value={String(allStats.length)} hint={`${allStats.filter((row) => row.isHealthy).length} up`} />
        <StatCard icon={ImageIcon} label="Images" value={imageSummary?.total || String(dockerImages.length)} hint={imageSummary ? `${imageSummary.size} total` : ''} />
        <StatCard icon={HardDrive} label="Build Cache" value={buildCacheSummary?.size || 'N/A'} hint={buildCacheSummary?.reclaimable || ''} />
      </div>

      <div className="rounded-2xl border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <StatsTab to="/stats/containers" label="Containers" />
          <StatsTab to="/stats/images" label="Images" />
          <StatsTab to="/stats/storage" label="Storage" />
        </div>
      </div>

      <Outlet />
    </div>
  );
};

export default Stats;
