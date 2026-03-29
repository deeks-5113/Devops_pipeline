import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, FolderOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react';

const FolderCard = ({ group, onRename, onDelete }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isUngrouped = group.id === 'ungrouped';
  // group.containerStats is an array of container objects with isHealthy
  const total   = group.containerStats?.length ?? 0;
  const healthy = group.containerStats?.filter(c => c.isHealthy).length ?? 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      onClick={() => navigate(`/folder/${group.id}`)}
      className={`
        relative group cursor-pointer rounded-xl border p-6 transition-all duration-200
        hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30
        ${isUngrouped
          ? 'bg-[var(--color-dark-surface)]/70 border-dashed border-[var(--color-dark-border)] hover:border-slate-500'
          : 'bg-[var(--color-dark-surface)] border-[var(--color-dark-border)] hover:border-slate-500'
        }
      `}
    >
      {/* ⋮ Context Menu — hidden for Ungrouped */}
      {!isUngrouped && (
        <div
          ref={menuRef}
          className="absolute top-3 right-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="p-1.5 rounded-md text-[var(--color-dark-muted)] hover:text-white hover:bg-[var(--color-dark-border)] transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-8 w-36 bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-lg shadow-xl overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onRename(group); }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-[var(--color-dark-border)] hover:text-white transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Rename</span>
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(group); }}
                className="w-full flex items-center space-x-2 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors group-hover:scale-110 duration-200 ${
        isUngrouped ? 'bg-slate-700/40' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
      }`}>
        {menuOpen
          ? <FolderOpen className="w-6 h-6 text-emerald-400" />
          : <Folder className={`w-6 h-6 ${isUngrouped ? 'text-slate-500' : 'text-emerald-500'}`} />
        }
      </div>

      {/* Name */}
      <h3 className="font-semibold text-slate-100 text-base mb-1 truncate pr-8">{group.name}</h3>
      <p className="text-sm text-[var(--color-dark-muted)] mb-4">
        {total} container{total !== 1 ? 's' : ''}
      </p>

      {/* Health summary */}
      {total > 0 && (
        <div className="flex items-center space-x-3 mt-auto">
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            <span className="text-xs text-emerald-400">{healthy} up</span>
          </div>
          {total - healthy > 0 && (
            <div className="flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              <span className="text-xs text-rose-400">{total - healthy} stopped</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderCard;
