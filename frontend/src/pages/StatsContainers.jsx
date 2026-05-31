import { useState } from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';
import { useMetricsHistory } from '../hooks/useMetricsHistory';

const parsePercent = (value) => {
  const parsed = Number.parseFloat(String(value || '').replace('%', ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const SortButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
        : 'border border-[var(--color-dark-border)] text-[var(--color-dark-muted)] hover:bg-[var(--color-dark-border)] hover:text-white'
    }`}
  >
    {children}
  </button>
);

const StatsContainers = () => {
  const { allStats } = useMetricsHistory();
  const [sortMode, setSortMode] = useState('default');

  const sortedStats = [...allStats];
  if (sortMode === 'cpu-desc') {
    sortedStats.sort((a, b) => parsePercent(b.cpu_perc) - parsePercent(a.cpu_perc));
  } else if (sortMode === 'ram-desc') {
    sortedStats.sort((a, b) => parsePercent(b.mem_perc) - parsePercent(a.mem_perc));
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-dark-border)] px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Container Stats</h2>
          <p className="mt-1 text-sm text-[var(--color-dark-muted)]">
            Live output aligned to docker stats --no-stream.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 inline-flex items-center gap-2 rounded-xl border border-[var(--color-dark-border)] px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] text-[var(--color-dark-muted)]">
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
            Sort
          </div>
          <SortButton active={sortMode === 'default'} onClick={() => setSortMode('default')}>Default</SortButton>
          <SortButton active={sortMode === 'cpu-desc'} onClick={() => setSortMode('cpu-desc')}>Highest CPU</SortButton>
          <SortButton active={sortMode === 'ram-desc'} onClick={() => setSortMode('ram-desc')}>Highest RAM</SortButton>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-mono uppercase tracking-[0.24em] text-emerald-300">
            {allStats.filter((row) => row.isHealthy).length}/{allStats.length} up
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[var(--color-dark-bg)]/50 text-[11px] uppercase tracking-[0.18em] text-[var(--color-dark-muted)]">
            <tr>
              <th className="px-6 py-4">Container ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">CPU %</th>
              <th className="px-6 py-4">Mem Usage / Limit</th>
              <th className="px-6 py-4">Mem %</th>
              <th className="px-6 py-4">Net I/O</th>
              <th className="px-6 py-4">Block I/O</th>
              <th className="px-6 py-4">PIDs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-dark-border)]">
            {sortedStats.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-sm text-[var(--color-dark-muted)]">
                  No container stats available.
                </td>
              </tr>
            ) : (
              sortedStats.map((container) => (
                <tr key={container.name} className="hover:bg-[var(--color-dark-bg)]/25">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{container.container_id || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`h-2.5 w-2.5 rounded-full ${container.isHealthy ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'}`} />
                      <div>
                        <div className="font-medium text-slate-100">{container.name}</div>
                        <div className="text-xs text-[var(--color-dark-muted)]">{container.status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-emerald-300">{container.cpu_perc}</td>
                  <td className="px-6 py-4 font-mono text-slate-300">{container.mem_usage}</td>
                  <td className="px-6 py-4 font-mono text-sky-300">{container.mem_perc}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{container.net_io}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{container.block_io}</td>
                  <td className="px-6 py-4 font-mono text-slate-200">{container.pids}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default StatsContainers;
