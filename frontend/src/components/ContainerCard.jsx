import { useState } from 'react';
import { Square, Play, RotateCw, GitPullRequest, Terminal, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import LogViewerModal from './LogViewerModal';
import Sparkline from './Sparkline';
import { useMetricsHistory } from '../hooks/useMetricsHistory';

const ACTION_CONFIG = {
  stop: { label: 'Stop', Icon: Square, iconColor: 'text-rose-400', requireConfirmString: true, title: 'Stop Container' },
  start: { label: 'Start', Icon: Play, iconColor: 'text-emerald-400', requireConfirmString: false, title: 'Start Container' },
  restart: { label: 'Restart', Icon: RotateCw, iconColor: 'text-amber-400', requireConfirmString: false, title: 'Restart Container' },
  redeploy: { label: 'Pull & Re-Deploy', Icon: GitPullRequest, iconColor: 'text-emerald-400', requireConfirmString: true, title: 'Pull & Redeploy' },
};

const ConfirmModal = ({ actionId, containerName, onConfirm, onCancel, isExecuting }) => {
  const cfg = ACTION_CONFIG[actionId];
  const [confirmInput, setConfirmInput] = useState('');
  const needsString = cfg.requireConfirmString;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] ring-1 ring-white/5 rounded-xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 rounded-full bg-slate-800"><AlertTriangle className={`w-6 h-6 ${cfg.iconColor}`} /></div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{cfg.title}</h3>
        <p className="text-sm text-[var(--color-dark-muted)] mb-4">
          This action will affect <strong>{containerName}</strong>. 
          {actionId === 'redeploy' && ' Code will be pulled, image rebuilt, and container restarted.'}
        </p>

        {needsString && (
          <div className="mb-6">
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide">Type <span className="text-slate-200 font-mono font-bold select-all">{containerName.toUpperCase()}</span> to confirm</label>
            <input 
              autoFocus
              className="w-full bg-[var(--color-dark-bg)] border border-[var(--color-dark-border)] hover:border-slate-500 focus:border-emerald-500 rounded-md px-3 py-2 text-sm text-slate-200 outline-none font-mono transition-colors uppercase"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value.toUpperCase())}
              placeholder="..."
            />
          </div>
        )}

        <div className="flex space-x-3 mt-6">
          <button onClick={onCancel} disabled={isExecuting} className="flex-1 px-4 py-2 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isExecuting || (needsString && confirmInput !== containerName.toUpperCase())}
            className="flex-1 px-4 py-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 flex items-center justify-center"
          >
            {isExecuting ? 'Executing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ContainerCard = ({ container, isProtected = false }) => {
  const { history } = useMetricsHistory();
  const [pendingAction, setPendingAction] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const isHealthy = container.status?.toLowerCase().includes('up');
  const sparkData = history[container.name] || [];

  const executeAction = async (actionId) => {
    setIsExecuting(true);
    let toastId = null;
    
    // Smart Toasts with Progress
    if (actionId === 'redeploy') { toastId = toast.loading(`${container.name}: Stopping & Pulling...`); } 
    else { toastId = toast.loading(`${container.name}: ${ACTION_CONFIG[actionId].label}...`); }

    try {
      const { data } = await axios.post(`/api/containers/${container.name}/${actionId}`);
      if (data.status === 'success') {
        toast.success(`${container.name}: Success`, { id: toastId });
      } else {
        toast.error(`${container.name}: ${data.output || 'Action failed'}`, { id: toastId });
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Request failed';
      toast.error(`${container.name}: ${detail}`, { id: toastId });
    } finally {
      setIsExecuting(false);
      setPendingAction(null);
    }
  };

  const cardInner = (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        relative flex flex-col bg-[var(--color-dark-surface)] rounded-xl border border-[var(--color-dark-border)]
        ring-1 ring-white/5 overflow-hidden transition-shadow duration-200 hover:shadow-xl hover:border-slate-600
        ${isHealthy ? 'led-glow-emerald border-t border-emerald-500/20' : 'led-glow-rose border-t border-rose-500/20'}
      `}
    >
      <div className="px-5 pt-5 pb-3 flex flex-col justify-between h-full group">
        <div className="flex items-start justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isHealthy ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]'}`} />
              <h3 className="font-semibold text-slate-100 text-[15px] truncate">{container.name}</h3>
              {container.ports && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50 truncate max-w-[140px] hidden sm:block">
                  {container.ports.split(',')[0]}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-dark-muted)] pl-4 truncate">{container.status}</p>
          </div>
          {isProtected && (
             <span className="ml-2 flex-shrink-0 text-[10px] font-mono text-emerald-500/80 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest bg-emerald-500/5">SYS</span>
          )}
        </div>

        <div className="mt-4 flex gap-x-4">
          <div className="flex-1 bg-[var(--color-dark-bg)] rounded-lg p-2.5 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
               <span>CPU</span>
               <span className="font-mono text-emerald-400">{container.cpu_perc || '0%'}</span>
            </div>
            <Sparkline data={sparkData.map(d => ({ cpu: d.cpu }))} color="#10b981" />
          </div>
        </div>

        {/* ── Action Toolbar ── */}
        {!isProtected && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-2">
            <button
               onClick={() => setShowLogs(true)}
               className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg bg-slate-800/40 hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-400 transition-colors text-xs font-semibold border border-slate-700/50 hover:border-emerald-500/30"
               title="Live Logs"
            >
              <Terminal className="w-4 h-4" /> <span>Logs</span>
            </button>
            

            {([isHealthy ? 'stop' : 'start', 'restart', 'redeploy']).map((actionId) => {
               const { Icon, iconColor, label } = ACTION_CONFIG[actionId];
               return (
                 <button
                    key={actionId}
                    onClick={() => setPendingAction(actionId)}
                    title={label}
                    className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 transition-colors border border-slate-700/50 hover:border-slate-500 text-xs font-semibold text-slate-300 ${iconColor.replace('text-', 'hover:text-')}`}
                 >
                   <Icon className={`w-4 h-4 ${iconColor}`} /> <span>{label}</span>
                 </button>
               )
            })}
          </div>
        )}

      </div>
    </motion.div>
  );

  return (
    <>
      {cardInner}

      {pendingAction && (
        <ConfirmModal
          actionId={pendingAction}
          containerName={container.name}
          onConfirm={() => executeAction(pendingAction)}
          onCancel={() => !isExecuting && setPendingAction(null)}
          isExecuting={isExecuting}
        />
      )}

      {showLogs && (
        <LogViewerModal containerName={container.name} onClose={() => setShowLogs(false)} />
      )}
    </>
  );
};

export default ContainerCard;
