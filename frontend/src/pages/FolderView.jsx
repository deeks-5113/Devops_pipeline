import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Folder, Plus, RefreshCw } from 'lucide-react';
import axios from '../lib/axios';
import ContainerCard from '../components/ContainerCard';
import GroupModal from '../components/GroupModal';
import toast from 'react-hot-toast';

const PROTECTED = new Set(['devops_dashboard_backend', 'devops_dashboard_frontend']);

const FolderView = () => {
  const { groupId }  = useParams();
  const navigate     = useNavigate();
  const isUngrouped  = groupId === 'ungrouped';

  const [group, setGroup]           = useState(null);
  const [allGroups, setAllGroups]   = useState([]);
  const [allStats, setAllStats]     = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [gRes, cRes] = await Promise.all([
        axios.get('/api/groups'),
        axios.get('/api/stats/containers'),
      ]);
      const groups     = gRes.data;
      const containers = cRes.data.map(c => ({ ...c, isHealthy: c.status?.toLowerCase().includes('up') }));

      setAllGroups(groups);
      setAllStats(containers);

      if (isUngrouped) {
        const assigned = new Set(groups.flatMap(g => g.containers));
        setGroup({
          id: 'ungrouped',
          name: 'Ungrouped',
          containers: containers.filter(c => !assigned.has(c.name)).map(c => c.name),
        });
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
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Containers that belong to this folder (with live stats merged in)
  const folderContainers = group
    ? allStats.filter(c => group.containers.includes(c.name))
    : [];

  // Containers not assigned to any group (for the Add modal)
  const assignedNames     = new Set(allGroups.flatMap(g => g.containers));
  const ungroupedAvailable = allStats.filter(c => !assignedNames.has(c.name));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-dark-muted)] animate-pulse">
        Loading…
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
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Folder className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{group?.name}</h1>
              <p className="text-sm text-[var(--color-dark-muted)]">
                {folderContainers.length} container{folderContainers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 rounded-lg border border-[var(--color-dark-border)] text-[var(--color-dark-muted)] hover:text-white hover:bg-[var(--color-dark-border)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!isUngrouped && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Container</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Bento Grid ── */}
      {folderContainers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed border-[var(--color-dark-border)] text-center">
          <Folder className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-[var(--color-dark-muted)] text-sm mb-4">No containers in this folder yet.</p>
          {!isUngrouped && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
            >
              Add Container
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {folderContainers.map(container => (
            <ContainerCard
              key={container.name}
              container={container}
              isProtected={PROTECTED.has(container.name)}
            />
          ))}
        </div>
      )}

      {/* ── Add Containers Modal ── */}
      {showAddModal && group && (
        <GroupModal
          mode="addContainers"
          group={group}
          ungroupedContainers={ungroupedAvailable}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { fetchData(); }}
        />
      )}
    </div>
  );
};

export default FolderView;
