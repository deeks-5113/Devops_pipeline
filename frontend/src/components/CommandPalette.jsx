import { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { useMetricsHistory } from '../hooks/useMetricsHistory';
import LogViewerModal from './LogViewerModal';
import { Terminal, Folder, Home, RotateCw, Square, Play, GitPullRequest, Search } from 'lucide-react';
import './CommandPalette.css'; // Custom styles for CMDK

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const { allStats } = useMetricsHistory();
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();
  
  const [showLogsContainer, setShowLogsContainer] = useState(null);

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch groups when palette opens
  useEffect(() => {
    if (open) {
      axios.get('/api/groups').then(res => setGroups(res.data)).catch(() => {});
    }
  }, [open]);

  const runAction = useCallback(async (containerName, actionId) => {
    setOpen(false);
    const toastId = toast.loading(`Executing ${actionId} on ${containerName}...`);
    try {
      const { data } = await axios.post(`/api/containers/${containerName}/${actionId}`);
      if (data.status === 'success') toast.success(`Success`, { id: toastId });
      else toast.error(`Failed: ${data.output}`, { id: toastId });
    } catch (err) {
      toast.error(`Request failed`, { id: toastId });
    }
  }, []);

  if (!open && !showLogsContainer) return null;

  return (
    <>
      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen} 
        label="Global Command Menu"
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-in fade-in"
      >
        <div className="bg-[var(--color-dark-surface)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--color-dark-border)] ring-1 ring-white/10 overflow-hidden text-slate-200">
          <div className="flex items-center px-4 border-b border-[var(--color-dark-border)]">
            <Search className="w-5 h-5 text-emerald-500 mr-2 shrink-0" />
            <Command.Input 
              autoFocus 
              placeholder="Type a command or search..." 
              className="w-full bg-transparent outline-none h-14 text-[15px] font-mono placeholder:text-slate-500"
            />
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 overscroll-contain">
            <Command.Empty className="p-6 text-center text-sm font-mono text-slate-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-mono uppercase tracking-widest text-slate-500 px-2 pt-2 mb-1">
              <Command.Item 
                onSelect={() => { navigate('/'); setOpen(false); }}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 aria-selected:bg-emerald-500/10 aria-selected:text-emerald-400 cursor-pointer"
              >
                <Home className="w-4 h-4" /> <span>Dashboard Home</span>
              </Command.Item>
              {groups.map(g => (
                <Command.Item 
                  key={g.id} 
                  onSelect={() => { navigate(`/folder/${g.id}`); setOpen(false); }}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 aria-selected:bg-slate-800 cursor-pointer"
                >
                  <Folder className="w-4 h-4 text-[var(--color-dark-muted)]" /> <span>Go to {g.name}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Container Actions" className="text-xs font-mono uppercase tracking-widest text-slate-500 px-2 pt-4 mb-1">
              {allStats.map(c => (
                <Command.Item 
                  key={`log-${c.name}`} 
                  onSelect={() => { setOpen(false); setShowLogsContainer(c.name); }}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 aria-selected:bg-slate-800 cursor-pointer"
                >
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span>View Logs: </span><strong className="font-mono text-emerald-400/80">{c.name}</strong>
                </Command.Item>
              ))}

              {allStats.map(c => {
                const isHealthy = c.status?.toLowerCase().includes('up');
                return (
                  <Command.Item 
                    key={`run-${c.name}`} 
                    onSelect={() => runAction(c.name, isHealthy ? 'stop' : 'start')}
                    className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 aria-selected:bg-slate-800 cursor-pointer"
                  >
                    {isHealthy ? <Square className="w-4 h-4 text-rose-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                    <span>{isHealthy ? 'Stop' : 'Start'} Container: </span><strong className="font-mono">{c.name}</strong>
                  </Command.Item>
                );
              })}
              
              {allStats.map(c => (
                <Command.Item 
                  key={`restart-${c.name}`} 
                  onSelect={() => runAction(c.name, 'restart')}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 aria-selected:bg-slate-800 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4 text-amber-400" />
                  <span>Restart Container: </span><strong className="font-mono">{c.name}</strong>
                </Command.Item>
              ))}
              
              {allStats.map(c => (
                <Command.Item 
                  key={`deploy-${c.name}`} 
                  onSelect={() => runAction(c.name, 'redeploy')}
                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800 aria-selected:bg-slate-800 cursor-pointer"
                >
                  <GitPullRequest className="w-4 h-4 text-indigo-400" />
                  <span>Pull & Deploy: </span><strong className="font-mono">{c.name}</strong>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="bg-[#11131a] border-t border-[var(--color-dark-border)] px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-mono tracking-widest shrink-0">
            <span>Power Menu</span>
            <div className="flex space-x-2">
               <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">↑↓</span> to navigate
               <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 ml-2">↵</span> to execute
            </div>
          </div>
        </div>
      </Command.Dialog>

      {showLogsContainer && (
        <LogViewerModal 
          containerName={showLogsContainer} 
          onClose={() => setShowLogsContainer(null)} 
        />
      )}
    </>
  );
};

export default CommandPalette;
