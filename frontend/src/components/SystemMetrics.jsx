/**
 * SystemMetrics — horizontal slim bar.
 * Used inside Dashboard.jsx as an inline-defined MetricsStrip.
 * Kept as exported component for potential reuse elsewhere.
 */
import { useEffect, useState } from 'react';
import axios from '../lib/axios';

const barColor = (pct) => {
  if (pct < 70) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
  if (pct < 90) return 'bg-amber-500  shadow-[0_0_8px_rgba(245,158,11,0.4)]';
  return             'bg-rose-500   shadow-[0_0_8px_rgba(244,63,94,0.4)]';
};

const Bar = ({ label, value }) => (
  <div className="flex items-center space-x-3 flex-1 min-w-0">
    <span className="text-xs font-medium text-[var(--color-dark-muted)] w-8 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-[var(--color-dark-bg)] rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor(value)}`}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-xs font-mono font-semibold text-white w-10 text-right shrink-0">
      {value.toFixed(1)}%
    </span>
  </div>
);

const SystemMetrics = () => {
  const [metrics, setMetrics] = useState({ cpu_percent: 0, ram_percent: 0 });

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        const { data } = await axios.get('/api/stats/system');
        if (mounted) setMetrics({ cpu_percent: data.cpu_percent, ram_percent: data.ram_percent });
      } catch { /* silent */ }
    };
    poll();
    const iv = setInterval(poll, 10000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  return (
    <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-6 py-4 flex items-center gap-6 flex-wrap">
      <span className="text-xs font-semibold text-[var(--color-dark-muted)] uppercase tracking-widest shrink-0">
        System
      </span>
      <Bar label="CPU" value={metrics.cpu_percent} />
      <div className="w-px h-4 bg-[var(--color-dark-border)] shrink-0 hidden sm:block" />
      <Bar label="RAM" value={metrics.ram_percent} />
    </div>
  );
};

export default SystemMetrics;
