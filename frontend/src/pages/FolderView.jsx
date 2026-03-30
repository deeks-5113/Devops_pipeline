import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Folder, Plus, RefreshCw } from 'lucide-react';
import axios from '../lib/axios';
import ContainerCard from '../components/ContainerCard';
import GroupModal from '../components/GroupModal';
import { useMetricsHistory } from '../hooks/useMetricsHistory';
import { motion, AnimatePresence } from 'framer-motion';

const PROTECTED = new Set(['devops_dashboard_backend', 'devops_dashboard_frontend']);

const FolderView = () => {
  const { groupId }  = useParams();
  const navigate     = useNavigate();
  const isUngrouped  = groupId === 'ungrouped';

  const { allStats } = useMetricsHistory();
  const [group, setGroup]           = useState(null);
  const [allGroups, setAllGroups]   = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const gRes = await axios.get('/api/groups');
      const groups = gRes.data;
      setAllGroups(groups);

      if (isUngrouped) {
        setGroup({ id: 'ungrouped', name: 'Ungrouped' });
      } else {
        const found = groups.find(g => g.id === groupId);
        if (!found) { navigate('/'); return; }
        setGroup(found);
      }
    } catch (err) {
      console.error('FolderView fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, isUngrouped, navigate]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Dynamically calculate containers not assigned to any group
  const assignedNames = new Set(allGroups.flatMap(g => g.containers));
  const ungroupedAvailable = allStats.filter(c => !assignedNames.has(c.name));

  // Dynamically resolve which containers to show on the screen
  const folderContainers = isUngrouped 
    ? ungroupedAvailable 
    : group 
      ? allStats.filter(c => group.containers.includes(c.name))
      : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-dark-muted)] animate-pulse font-mono tracking-widest text-sm uppercase">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg border border-[var(--color-dark-border)] text-[var(--color-dark-muted)] hover:text-white hover:bg-[var(--color-dark-border)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isUngrouped ? 'bg-slate-700/40' : 'bg-emerald-500/10'}`}>
              <Folder className={`w-5 h-5 ${isUngrouped ? 'text-slate-500' : 'text-emerald-500'}`} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">{group?.name}</h1>
              <p className="text-sm font-mono text-[var(--color-dark-muted)]">
                {folderContainers.length} container{folderContainers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchGroups}
            title="Refresh Folders"
            className="p-2 rounded-lg border border-[var(--color-dark-border)] text-[var(--color-dark-muted)] hover:text-white hover:bg-[var(--color-dark-border)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!isUngrouped && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Add Container</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Bento Grid ── */}
      {folderContainers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 mt-4 rounded-xl border border-dashed border-[var(--color-dark-border)] text-center relative overflow-hidden mesh-gradient min-h-[300px]">
          <div className="absolute inset-0 bg-[var(--color-dark-bg)]/80 backdrop-blur-[2px]"></div>
          <div className="relative z-10 flex flex-col items-center">
            <Folder className="w-16 h-16 text-slate-700/50 mb-4" />
            <p className="text-[var(--color-dark-muted)] font-medium text-lg mb-2 tracking-wide">Empty Folder</p>
            <p className="text-slate-500 text-sm mb-6 max-w-sm">There are no containers assigned to this group yet. Add containers to start monitoring their telemetry.</p>
            {!isUngrouped && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 font-medium text-sm rounded-lg transition-colors ring-1 ring-emerald-500/30"
              >
                Assign Containers
              </button>
            )}
          </div>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {folderContainers.map(container => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={container.name}
              >
                <ContainerCard
                  container={container}
                  isProtected={PROTECTED.has(container.name)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add Containers Modal ── */}
      {showAddModal && group && (
        <GroupModal
          mode="addContainers"
          group={group}
          ungroupedContainers={ungroupedAvailable}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { fetchGroups(); }}
        />
      )}
    </div>
  );
};

export default FolderView;
