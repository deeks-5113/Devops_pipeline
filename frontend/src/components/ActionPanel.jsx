import { useState } from 'react';
import { Play, RotateCw, AlertTriangle, X } from 'lucide-react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

const ActionPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const actions = [
    { id: 'deploy_backend', label: 'Deploy Backend', icon: Play, color: 'text-emerald-500', bgHover: 'hover:bg-emerald-500/10' },
    { id: 'deploy_frontend', label: 'Deploy Frontend', icon: Play, color: 'text-blue-500', bgHover: 'hover:bg-blue-500/10' },
    { id: 'restart_nginx', label: 'Restart Nginx', icon: RotateCw, color: 'text-amber-500', bgHover: 'hover:bg-amber-500/10', destructive: true },
  ];

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedAction) return;
    
    setIsExecuting(true);
    try {
      // Mocking the API based on requested contracts
      // const res = await axios.post(`/api/actions/${selectedAction.id}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`${selectedAction.label} executed successfully`);
    } catch (error) {
      toast.error(`Failed to execute ${selectedAction.label}`);
    } finally {
      setIsExecuting(false);
      setIsModalOpen(false);
      setSelectedAction(null);
    }
  };

  return (
    <>
      <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Execution Controls</h2>
        
        <div className="flex flex-col gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border border-[var(--color-dark-border)] bg-[var(--color-dark-bg)] ${action.bgHover} transition-colors group`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {isModalOpen && selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <button 
                  onClick={() => !isExecuting && setIsModalOpen(false)}
                  className="text-[var(--color-dark-muted)] hover:text-white transition-colors"
                  disabled={isExecuting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">Confirm Execution</h3>
              <p className="text-sm text-[var(--color-dark-muted)] mb-6">
                Are you sure you want to execute <span className="text-white font-medium">{selectedAction.label}</span>? 
                {selectedAction.destructive ? " This may cause temporary downtime." : ""}
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isExecuting}
                  className="flex-1 px-4 py-2 border border-[var(--color-dark-border)] rounded-lg text-sm font-medium text-slate-300 hover:bg-[var(--color-dark-bg)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={isExecuting}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isExecuting ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ActionPanel;
