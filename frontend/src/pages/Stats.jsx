import { Activity, Cpu, HardDrive, Image as ImageIcon, MemoryStick, RefreshCw } from 'lucide-react';
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

const SectionShell = ({ title, subtitle, actions, children }) => (
  <section className="overflow-hidden rounded-2xl border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-dark-border)] px-6 py-5">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--color-dark-muted)]">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
    {children}
  </section>
);

const Stats = () => {
  const { systemMetrics, allStats, dockerImages, dockerStorage, isFetching, forceFetch } = useMetricsHistory();

  const imageSummary = dockerStorage.find((row) => row.type === 'Images');
  const containerSummary = dockerStorage.find((row) => row.type === 'Containers');
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

      <SectionShell
        title="Container Stats"
        subtitle="Live output aligned to docker stats --no-stream."
        actions={
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-emerald-300">
            {allStats.filter((row) => row.isHealthy).length}/{allStats.length} up
          </span>
        }
      >
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
              {allStats.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-sm text-[var(--color-dark-muted)]">
                    No container stats available.
                  </td>
                </tr>
              ) : (
                allStats.map((container) => (
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
      </SectionShell>

      <SectionShell
        title="Docker Images"
        subtitle="Image inventory with size information from docker image ls."
        actions={
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-slate-300">
            {dockerImages.length} images
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-dark-bg)]/50 text-[11px] uppercase tracking-[0.18em] text-[var(--color-dark-muted)]">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Disk Usage</th>
                <th className="px-6 py-4">Content Size</th>
                <th className="px-6 py-4">Extra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-dark-border)]">
              {dockerImages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-[var(--color-dark-muted)]">
                    No image data available.
                  </td>
                </tr>
              ) : (
                dockerImages.map((image) => (
                  <tr key={`${image.name}-${image.image_id}`} className="hover:bg-[var(--color-dark-bg)]/25">
                    <td className="px-6 py-4 font-medium text-slate-100">{image.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{image.image_id}</td>
                    <td className="px-6 py-4 font-mono text-slate-300">{image.disk_usage}</td>
                    <td className="px-6 py-4 font-mono text-sky-300">{image.content_size}</td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-300">{image.extra || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionShell>

      <SectionShell
        title="Docker System DF"
        subtitle="Storage summary aligned to docker system df."
        actions={
          containerSummary ? (
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-slate-300">
              Containers {containerSummary.size}
            </span>
          ) : null
        }
      >
        <div className="grid grid-cols-1 gap-4 border-b border-[var(--color-dark-border)] p-6 md:grid-cols-2 xl:grid-cols-4">
          {dockerStorage.map((row) => (
            <div key={row.type} className="rounded-xl border border-[var(--color-dark-border)] bg-[var(--color-dark-bg)]/40 p-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-dark-muted)]">{row.type}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{row.size}</p>
              <div className="mt-4 space-y-1 text-xs font-mono text-[var(--color-dark-muted)]">
                <p>Total: {row.total}</p>
                <p>Active: {row.active}</p>
                <p>Reclaimable: {row.reclaimable}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-dark-bg)]/50 text-[11px] uppercase tracking-[0.18em] text-[var(--color-dark-muted)]">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Reclaimable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-dark-border)]">
              {dockerStorage.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-sm text-[var(--color-dark-muted)]">
                    No docker system df data available.
                  </td>
                </tr>
              ) : (
                dockerStorage.map((row) => (
                  <tr key={row.type} className="hover:bg-[var(--color-dark-bg)]/25">
                    <td className="px-6 py-4 font-medium text-slate-100">{row.type}</td>
                    <td className="px-6 py-4 font-mono text-slate-300">{row.total}</td>
                    <td className="px-6 py-4 font-mono text-slate-300">{row.active}</td>
                    <td className="px-6 py-4 font-mono text-slate-200">{row.size}</td>
                    <td className="px-6 py-4 font-mono text-amber-300">{row.reclaimable}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionShell>
    </div>
  );
};

export default Stats;
