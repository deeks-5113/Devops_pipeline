import { useEffect, useRef, useState } from 'react';
import { Terminal, X } from 'lucide-react';

const LogViewerModal = ({ containerName, onClose }) => {
  const [logs, setLogs] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      try {
        // Mock Implementation based on requirements
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (isMounted) {
          const mockLogs = `[INFO] Starting container ${containerName}...
[INFO] Loading dependencies...
[WARN] Deprecated feature used in app.js:42
[INFO] Server started on port ${containerName === 'backend_container' ? '4000' : '3000'}
[INFO] Database connected successfully.
[INFO] Listening for connections...
`;
          setLogs(mockLogs);
        }
      } catch (error) {
        if (isMounted) setLogs(`Error fetching logs for ${containerName}`);
      } finally {
         if (isMounted) setIsLoading(false);
      }
    };

    fetchLogs();

    return () => {
      isMounted = false;
    };
  }, [containerName]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-[var(--color-terminal-bg)] border border-[var(--color-dark-border)] rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-[var(--color-dark-surface)] border-b border-[var(--color-dark-border)] px-4 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-mono text-slate-300">Logs: {containerName}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--color-dark-muted)] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-[var(--color-terminal-text)] whitespace-pre-wrap">
          {isLoading ? (
            <div className="flex items-center space-x-2 animate-pulse text-emerald-500/70">
              <div className="w-2 h-4 bg-emerald-500/70"></div>
              <span>Connecting to log stream...</span>
            </div>
          ) : (
            <>
              {logs}
              <div ref={logsEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewerModal;
