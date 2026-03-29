import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

/**
 * GroupModal — handles three modes:
 *   'create'        → POST /api/groups   (name input)
 *   'rename'        → PUT  /api/groups/:id (pre-filled name input)
 *   'addContainers' → PUT  /api/groups/:id (checkbox list of ungrouped containers)
 */
const GroupModal = ({ mode, group, ungroupedContainers = [], onClose, onSuccess }) => {
  const [name, setName] = useState(group?.name ?? '');
  const [selected, setSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (containerName) =>
    setSelected(prev =>
      prev.includes(containerName) ? prev.filter(c => c !== containerName) : [...prev, containerName]
    );

  const isValid = mode === 'addContainers' ? selected.length > 0 : name.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsLoading(true);
    try {
      if (mode === 'create') {
        const { data } = await axios.post('/api/groups', { name: name.trim(), containers: [] });
        toast.success(`Folder "${name.trim()}" created`);
        onSuccess(data);
      } else if (mode === 'rename') {
        const { data } = await axios.put(`/api/groups/${group.id}`, { name: name.trim() });
        toast.success(`Renamed to "${name.trim()}"`);
        onSuccess(data);
      } else if (mode === 'addContainers') {
        const merged = [...new Set([...(group.containers ?? []), ...selected])];
        const { data } = await axios.put(`/api/groups/${group.id}`, { containers: merged });
        toast.success(`Added ${selected.length} container${selected.length !== 1 ? 's' : ''}`);
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const titles = { create: 'New Folder', rename: 'Rename Folder', addContainers: 'Add Containers' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-dark-border)]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FolderPlus className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-base font-semibold text-white">{titles[mode]}</h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-dark-muted)] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {(mode === 'create' || mode === 'rename') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Folder Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="e.g. Production, Database, Dev..."
                className="w-full bg-[var(--color-dark-bg)] border border-[var(--color-dark-border)] text-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors placeholder:text-slate-600"
              />
            </div>
          )}

          {mode === 'addContainers' && (
            <div>
              <p className="text-sm font-medium text-slate-300 mb-3">
                Add to <span className="text-white font-semibold">{group?.name}</span>
              </p>
              {ungroupedContainers.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-dark-muted)] text-sm">
                  No ungrouped containers available.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {ungroupedContainers.map(c => (
                    <label
                      key={c.name}
                      className="flex items-center space-x-3 p-3 rounded-lg border border-[var(--color-dark-border)] hover:bg-[var(--color-dark-bg)] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(c.name)}
                        onChange={() => toggle(c.name)}
                        className="w-4 h-4 accent-emerald-500"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{c.name}</p>
                        <p className="text-xs text-[var(--color-dark-muted)] truncate">{c.status}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[var(--color-dark-border)] rounded-lg text-sm font-medium text-slate-300 hover:bg-[var(--color-dark-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? <Spinner /> : (mode === 'addContainers' ? 'Add' : 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
