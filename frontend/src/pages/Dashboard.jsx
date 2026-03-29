import { useState, useEffect, useCallback } from 'react';
import { Plus, FolderOpen, RefreshCw } from 'lucide-react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import FolderCard from '../components/FolderCard';
import GroupModal from '../components/GroupModal';

// ── Inline slim metrics strip ────────────────────────────────────────────────
const MetricsStrip = () => {
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

  const barColor = (pct) => {
    if (pct < 70) return 'bg-emerald-500';
    if (pct < 90) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const Item = ({ label, value }) => (
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      <span className="text-xs font-medium text-[var(--color-dark-muted)] w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--color-dark-bg)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono text-white w-10 text-right shrink-0">{value.toFixed(1)}%</span>
    </div>
  );

  return (
    <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl px-6 py-4 flex items-center gap-6 flex-wrap">
      <span className="text-xs font-semibold text-[var(--color-dark-muted)] uppercase tracking-widest shrink-0">System</span>
      <Item label="CPU" value={metrics.cpu_percent} />
      <div className="w-px h-4 bg-[var(--color-dark-border)] shrink-0 hidden sm:block" />
      <Item label="RAM" value={metrics.ram_percent} />
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [groups, setGroups]           = useState([]);
  const [allStats, setAllStats]       = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [modal, setModal]             = useState(null); // { mode, group? }

  const fetchData = useCallback(async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        axios.get('/api/groups'),
        axios.get('/api/stats/containers'),
      ]);
      const containers = cRes.data.map(c => ({
        ...c,
        isHealthy: c.status?.toLowerCase().includes('up'),
      }));
      setGroups(gRes.data);
      setAllStats(containers);
    } catch (err) {
      console.error('Dashboard fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build enriched groups for FolderCard (with live containerStats)
  const assignedNames = new Set(groups.flatMap(g => g.containers));

  const enrichedGroups = groups.map(g => ({
    ...g,
    containerStats: allStats.filter(c => g.containers.includes(c.name)),
  }));

  const ungroupedStats = allStats.filter(c => !assignedNames.has(c.name));
  const ungroupedGroup = {
    id: 'ungrouped',
    name: 'Ungrouped',
    containers: ungroupedStats.map(c => c.name),
    containerStats: ungroupedStats,
  };

  const handleDelete = async (group) => {
    try {
      await axios.delete(`/api/groups/${group.id}`);
      toast.success(`Folder "${group.name}" deleted`);
      fetchData();
    } catch {
      toast.error('Failed to delete folder');
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics strip */}
      <MetricsStrip />

      {/* Folder toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderOpen className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">Folders</h2>
          <span className="text-xs text-[var(--color-dark-muted)] bg-[var(--color-dark-border)] px-2 py-0.5 rounded-full">
            {groups.length + (ungroupedStats.length > 0 ? 1 : 0)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 rounded-lg border border-[var(--color-dark-border)] text-[var(--color-dark-muted)] hover:text-white hover:bg-[var(--color-dark-border)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {/* Folder grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl p-6 h-44 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {enrichedGroups.map(group => (
            <FolderCard
              key={group.id}
              group={group}
              onRename={(g) => setModal({ mode: 'rename', group: g })}
              onDelete={handleDelete}
            />
          ))}
          {ungroupedStats.length > 0 && (
            <FolderCard
              key="ungrouped"
              group={ungroupedGroup}
              onRename={() => {}}
              onDelete={() => {}}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {modal?.mode === 'create' && (
        <GroupModal
          mode="create"
          onClose={() => setModal(null)}
          onSuccess={() => { fetchData(); }}
        />
      )}
      {modal?.mode === 'rename' && modal.group && (
        <GroupModal
          mode="rename"
          group={modal.group}
          onClose={() => setModal(null)}
          onSuccess={() => { fetchData(); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
