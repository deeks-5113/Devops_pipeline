import { useState, useEffect, useCallback } from 'react';
import { Plus, FolderOpen, RefreshCw } from 'lucide-react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import FolderCard from '../components/FolderCard';
import GroupModal from '../components/GroupModal';
import { useMetricsHistory } from '../hooks/useMetricsHistory';

const MetricsStrip = () => {
  const { systemMetrics, isFetching } = useMetricsHistory();

  const barColor = (pct) => {
    if (pct < 70) return 'bg-emerald-500';
    if (pct < 90) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const Item = ({ label, value }) => (
    <div className="flex items-center space-x-3 flex-1 min-w-0">
      <span className="text-xs font-medium text-[var(--color-dark-muted)] w-8 shrink-0 tracking-wide">{label}</span>
      <div className="flex-1 h-1.5 bg-[var(--color-dark-bg)] rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono text-white w-10 text-right shrink-0">{value.toFixed(1)}%</span>
    </div>
  );

  return (
    <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] shadow-md rounded-xl px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative flex items-center justify-center w-3 h-3">
           <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isFetching ? 'animate-ping bg-emerald-400' : 'bg-emerald-500'}`}></span>
           <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span className="text-xs font-bold text-[var(--color-dark-muted)] uppercase tracking-widest shrink-0">System Live</span>
      </div>
      
      <div className="flex items-center gap-6 flex-1 max-w-xl mx-auto">
        <Item label="CPU" value={systemMetrics.cpu_percent} />
        <div className="w-px h-4 bg-[var(--color-dark-border)] shrink-0 hidden sm:block" />
        <Item label="RAM" value={systemMetrics.ram_percent} />
      </div>
    </div>
  );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { allStats } = useMetricsHistory();
  const [groups, setGroups]           = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [modal, setModal]             = useState(null); // { mode, group? }

  const fetchGroups = useCallback(async () => {
    try {
      const gRes = await axios.get('/api/groups');
      setGroups(gRes.data);
    } catch (err) {
      console.error('Dashboard groups fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

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
      fetchGroups();
    } catch {
      toast.error('Failed to delete folder');
    }
  };

  return (
    <div className="space-y-6">
      <MetricsStrip />

      {/* Folder toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderOpen className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">Folders</h2>
          <span className="text-xs text-[var(--color-dark-muted)] bg-[var(--color-dark-border)] px-2 py-0.5 rounded-full font-mono">
            {groups.length + (ungroupedStats.length > 0 ? 1 : 0)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchGroups}
            title="Refresh Folders"
            className="p-2 rounded-lg border border-[var(--color-dark-border)] text-[var(--color-dark-muted)] hover:text-white hover:bg-[var(--color-dark-border)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10"
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
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {enrichedGroups.map(group => (
              <motion.div 
                layout
                key={group.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <FolderCard
                  group={group}
                  onRename={(g) => setModal({ mode: 'rename', group: g })}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
            {ungroupedStats.length > 0 && (
              <motion.div
                layout
                key="ungrouped"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <FolderCard
                  group={ungroupedGroup}
                  onRename={() => {}}
                  onDelete={() => {}}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modals */}
      {modal?.mode === 'create' && (
        <GroupModal
          mode="create"
          onClose={() => setModal(null)}
          onSuccess={() => { fetchGroups(); }}
        />
      )}
      {modal?.mode === 'rename' && modal.group && (
        <GroupModal
          mode="rename"
          group={modal.group}
          onClose={() => setModal(null)}
          onSuccess={() => { fetchGroups(); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
