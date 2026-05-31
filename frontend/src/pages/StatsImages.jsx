import { useMetricsHistory } from '../hooks/useMetricsHistory';

const StatsImages = () => {
  const { dockerImages } = useMetricsHistory();

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-dark-border)] bg-[var(--color-dark-surface)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-dark-border)] px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Docker Images</h2>
          <p className="mt-1 text-sm text-[var(--color-dark-muted)]">
            Image inventory with size information from docker image ls.
          </p>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-mono uppercase tracking-[0.24em] text-slate-300">
          {dockerImages.length} images
        </span>
      </div>

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
    </section>
  );
};

export default StatsImages;
