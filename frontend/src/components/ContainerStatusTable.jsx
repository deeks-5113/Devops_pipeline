import { useEffect, useState } from 'react';
import { Box, TerminalSquare } from 'lucide-react';
import LogViewerModal from './LogViewerModal';

const ContainerStatusTable = () => {
  const [containers, setContainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContainerLogs, setSelectedContainerLogs] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchContainers = async () => {
      try {
        // Mock Implementation
        await new Promise(resolve => setTimeout(resolve, 500));
        if (isMounted) {
          setContainers([
            { name: "backend_container", status: "Up 2 days", ports: "4000:4000", isHealthy: true },
            { name: "frontend_container", status: "Up 2 days", ports: "3000:80", isHealthy: true }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch containers", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchContainers();
    const interval = setInterval(fetchContainers, 15000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-[var(--color-dark-border)] flex items-center space-x-2">
        <Box className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-white">Container Status</h2>
      </div>

      <div className="p-0 overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[var(--color-dark-bg)]/50 text-[var(--color-dark-muted)] font-medium">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Uptime</th>
              <th className="px-6 py-4">Ports</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-dark-border)] text-slate-300">
            {isLoading ? (
               <tr>
                 <td colSpan="5" className="px-6 py-8 text-center text-[var(--color-dark-muted)] animate-pulse">
                   Loading container data...
                 </td>
               </tr>
            ) : containers.length === 0 ? (
               <tr>
                 <td colSpan="5" className="px-6 py-8 text-center text-[var(--color-dark-muted)]">
                   No containers found.
                 </td>
               </tr>
            ) : (
              containers.map((container) => (
                <tr key={container.name} className="hover:bg-[var(--color-dark-bg)]/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${container.isHealthy ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`}></div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-200">{container.name}</td>
                  <td className="px-6 py-4 text-[var(--color-dark-muted)]">{container.status}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[var(--color-dark-muted)]">{container.ports}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedContainerLogs(container.name)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-[var(--color-dark-border)] rounded hover:bg-[var(--color-dark-bg)] hover:text-white transition-colors text-xs font-medium"
                    >
                      <TerminalSquare className="w-3.5 h-3.5" />
                      <span>View Logs</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedContainerLogs && (
        <LogViewerModal 
          containerName={selectedContainerLogs} 
          onClose={() => setSelectedContainerLogs(null)} 
        />
      )}
    </div>
  );
};

export default ContainerStatusTable;
