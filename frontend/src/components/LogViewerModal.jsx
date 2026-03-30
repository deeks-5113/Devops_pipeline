import { useEffect, useRef, useState } from 'react';
import { Terminal, X, Maximize2, Minimize2, Download, ArrowDownCircle } from 'lucide-react';
import Ansi from 'ansi-to-react';

const LogViewerModal = ({ containerName, onClose }) => {
  const [lines, setLines]             = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError]             = useState(null);
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoScroll, setAutoScroll]     = useState(true);

  const logsEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
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

  // Handle auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [lines, autoScroll]);

  // Handle user scrolling up to pause auto-scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false);
    } else if (isAtBottom && !autoScroll) {
      setAutoScroll(true);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${containerName}-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all ${isFullScreen ? 'md:p-0' : 'md:p-8'}`}>
      <div 
        className={`bg-[#0d1117] border border-slate-700/50 flex flex-col shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullScreen ? 'w-screen h-screen rounded-none' : 'w-full max-w-5xl h-[80vh] rounded-xl ring-1 ring-white/10'
        }`}
      >
        {/* Titlebar */}
        <div className="bg-[#161b22] border-b border-slate-700/50 px-4 py-2 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-mono text-slate-300 font-semibold tracking-wide">
              {isConnecting ? 'Connecting…' : containerName}
            </span>
            {!isConnecting && !error && (
              <span className="flex items-center space-x-1.5 ml-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded">live</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              title={autoScroll ? "Disable Auto-scroll" : "Enable Auto-scroll"}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors ${
                autoScroll ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Follow</span>
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1" />
            <button
              onClick={handleDownload}
              title="Download Log"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title="Toggle Fullscreen"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Log body */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 p-4 overflow-y-auto font-mono text-[13px] bg-[#0d1117] text-slate-300 whitespace-pre-wrap leading-relaxed"
        >
          {isConnecting && (
            <div className="flex items-center space-x-2 animate-pulse text-emerald-500/70">
              <div className="w-2 h-4 bg-emerald-500/70" />
              <span>Connecting to log stream…</span>
            </div>
          )}

          {error && (
            <div className="text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-2">
              Connection error: {error}
            </div>
          )}

          <div className="min-h-full">
            {lines.map((line, i) => (
              <div key={i} className="hover:bg-white/5 px-1 -mx-1 rounded-sm">
                <Ansi>{line || '\u00A0'}</Ansi>
              </div>
            ))}
            <div ref={logsEndRef} className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewerModal;
