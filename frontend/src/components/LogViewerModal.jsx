import { useEffect, useRef, useState } from 'react';
import { Terminal, X } from 'lucide-react';

const LogViewerModal = ({ containerName, onClose }) => {
  const [lines, setLines]             = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError]             = useState(null);
  const logsEndRef = useRef(null);
  const readerRef  = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const token   = localStorage.getItem('auth_token');
    const baseURL = `${window.location.protocol}//${window.location.hostname}:8720`;

    const streamLogs = async () => {
      try {
        const response = await fetch(
          `${baseURL}/api/containers/${containerName}/logs`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          throw new Error(`Server error ${response.status}`);
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder();

        if (isMounted) setIsConnecting(false);

        while (true) {
          const { done, value } = await reader.read();
          if (done || !isMounted) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE lines: "data: <content>\n\n"
          const newLines = chunk
            .split('\n')
            .filter(l => l.startsWith('data: '))
            .map(l => l.slice(6));

          if (isMounted && newLines.length > 0) {
            setLines(prev => [...prev, ...newLines]);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsConnecting(false);
        }
      }
    };

    streamLogs();

    return () => {
      isMounted = false;
      readerRef.current?.cancel();
    };
  }, [containerName]);

  // Auto-scroll on new lines
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-[var(--color-terminal-bg)] border border-[var(--color-dark-border)] rounded-xl w-full max-w-4xl h-[72vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Titlebar */}
        <div className="bg-[var(--color-dark-surface)] border-b border-[var(--color-dark-border)] px-5 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-mono text-slate-300">
              {isConnecting ? 'Connecting…' : `logs: ${containerName}`}
            </span>
            {!isConnecting && !error && (
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wide">live</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-dark-muted)] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log body */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-[var(--color-terminal-text)] whitespace-pre-wrap">
          {isConnecting && (
            <div className="flex items-center space-x-2 animate-pulse text-emerald-500/70">
              <div className="w-2 h-4 bg-emerald-500/70" />
              <span>Connecting to log stream…</span>
            </div>
          )}

          {error && (
            <div className="text-rose-400">Connection error: {error}</div>
          )}

          {lines.map((line, i) => (
            <div key={i} className="leading-relaxed">{line || '\u00A0'}</div>
          ))}

          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default LogViewerModal;
