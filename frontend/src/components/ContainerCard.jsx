import { useState } from 'react';
import { Square, RotateCw, GitPullRequest, Terminal, X, AlertTriangle } from 'lucide-react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import LogViewerModal from './LogViewerModal';

// Fully-resolved Tailwind classes (no dynamic template literals — required for JIT)
const ACTION_CONFIG = {
  stop: {
    label: 'Stop',
    Icon: Square,
    btnClass: 'text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/60',
    confirmTitle: 'Stop Container',
    confirmBody: (name) => `This will stop ${name}. The service will be unavailable until restarted.`,
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    confirmBtn: 'bg-rose-600 hover:bg-rose-500',
  },
  restart: {
    label: 'Restart',
    Icon: RotateCw,
    btnClass: 'text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/60',
    confirmTitle: 'Restart Container',
    confirmBody: (name) => `This will restart ${name}. There will be a brief interruption.`,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    confirmBtn: 'bg-amber-600 hover:bg-amber-500',
  },
  redeploy: {
    label: 'Pull & Deploy',
    Icon: GitPullRequest,
    btnClass: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/60',
    confirmTitle: 'Pull & Redeploy',
    confirmBody: (name) => `This will pull the latest code, rebuild and restart ${name}. Service will be briefly unavailable.`,
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-500',
  },
};

const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ConfirmModal = ({ actionId, containerName, onConfirm, onCancel, isExecuting }) => {
  const cfg = ACTION_CONFIG[actionId];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl w-full max-w-sm shadow-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2 rounded-full ${cfg.iconBg}`}>
            <AlertTriangle className={`w-6 h-6 ${cfg.iconColor}`} />
          </div>
          <button onClick={onCancel} disabled={isExecuting} className="text-[var(--color-dark-muted)] hover:text-white transition-colors disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{cfg.confirmTitle}</h3>
        <p className="text-sm text-[var(--color-dark-muted)] mb-6">{cfg.confirmBody(containerName)}</p>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isExecuting}
            className="flex-1 px-4 py-2 border border-[var(--color-dark-border)] rounded-lg text-sm font-medium text-slate-300 hover:bg-[var(--color-dark-bg)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className={`flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50 ${cfg.confirmBtn}`}
          >
            {isExecuting ? <Spinner /> : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ContainerCard = ({ container, isProtected = false }) => {
  const [pendingAction, setPendingAction] = useState(null);
  const [isExecuting, setIsExecuting]   = useState(false);
  const [showLogs, setShowLogs]         = useState(false);

  const isHealthy = container.status?.toLowerCase().includes('up');

  const executeAction = async (actionId) => {
    setIsExecuting(true);
    try {
      const { data } = await axios.post(`/api/containers/${container.name}/${actionId}`);
      if (data.status === 'success') {
        toast.success(`${container.name}: ${ACTION_CONFIG[actionId].label} successful`);
      } else {
        toast.error(`${container.name}: ${data.output || 'Action failed'}`);
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Request failed';
      toast.error(`${container.name}: ${detail}`);
    } finally {
      setIsExecuting(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className={`
        relative flex flex-col bg-[var(--color-dark-surface)] rounded-xl border border-[var(--color-dark-border)]
        overflow-hidden transition-all duration-200 hover:border-slate-600 hover:shadow-lg
        ${isHealthy ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'}
      `}>

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center space-x-2 mb-0.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isHealthy
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`} />
              <h3 className="font-semibold text-slate-100 text-sm truncate">{container.name}</h3>
            </div>
            <p className="text-xs text-[var(--color-dark-muted)] pl-4 truncate">{container.status}</p>
          </div>
          {isProtected && (
            <span className="ml-2 flex-shrink-0 text-[10px] font-medium bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full border border-slate-600/40 uppercase tracking-wide">
              system
            </span>
          )}
        </div>

        {/* ── Stats Grid ── */}
        <div className="px-5 pb-4 grid grid-cols-2 gap-2 flex-1">
          <div className="bg-[var(--color-dark-bg)] rounded-lg p-3">
            <p className="text-[10px] font-medium text-[var(--color-dark-muted)] uppercase tracking-wide mb-1">CPU</p>
            <p className="text-sm font-mono font-semibold text-emerald-400">{container.cpu_perc || 'N/A'}</p>
          </div>
          <div className="bg-[var(--color-dark-bg)] rounded-lg p-3">
            <p className="text-[10px] font-medium text-[var(--color-dark-muted)] uppercase tracking-wide mb-1">RAM</p>
            <p className="text-sm font-mono font-semibold text-blue-400">{container.mem_usage || 'N/A'}</p>
          </div>
          {container.ports && (
            <div className="col-span-2 bg-[var(--color-dark-bg)] rounded-lg p-3">
              <p className="text-[10px] font-medium text-[var(--color-dark-muted)] uppercase tracking-wide mb-1">Ports</p>
              <p className="text-xs font-mono text-slate-300 truncate">{container.ports}</p>
            </div>
          )}
        </div>

        {/* ── Action Buttons (hidden for protected containers) ── */}
        {!isProtected && (
          <div className="px-5 pb-5 border-t border-[var(--color-dark-border)] pt-4 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {(['stop', 'restart', 'redeploy']).map((actionId) => {
                const { label, Icon, btnClass } = ACTION_CONFIG[actionId];
                return (
                  <button
                    key={actionId}
                    onClick={() => setPendingAction(actionId)}
                    disabled={isExecuting}
                    className={`flex flex-col items-center justify-center space-y-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-all ${btnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowLogs(true)}
              disabled={isExecuting}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border border-[var(--color-dark-border)] text-slate-400 hover:bg-slate-700/20 hover:text-slate-200 text-xs font-medium transition-all disabled:opacity-40"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>View Live Logs</span>
            </button>
          </div>
        )}
      </div>

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
