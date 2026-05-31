import { useMetricsHistory } from '../hooks/useMetricsHistory';

const StatsStorage = () => {
  const { dockerStorage } = useMetricsHistory();
  const containerSummary = dockerStorage.find((row) => row.type === 'Containers');

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-dark-border)] px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Docker System DF</h2>
          <p className="mt-1 text-sm text-[var(--color-dark-muted)]">
            Storage summary aligned to docker system df.
          </p>
        </div>
        {containerSummary ? (
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-slate-300">
            Containers {containerSummary.size}
          </span>
        ) : null}
      </div>

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
    </section>
  );
};

export default StatsStorage;
