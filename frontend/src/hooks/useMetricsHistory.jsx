import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import axios from '../lib/axios';

const MetricsContext = createContext(null);

export const MetricsProvider = ({ children }) => {
  const [history, setHistory] = useState({});
  const [systemMetrics, setSystemMetrics] = useState({ cpu_percent: 0, ram_percent: 0 });
  const [allStats, setAllStats] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  // Poll every 10 seconds
  const fetchMetrics = useCallback(async () => {
    setIsFetching(true);
    try {
      const [sysRes, cRes] = await Promise.all([
        axios.get('/api/stats/system').catch(() => ({ data: { cpu_percent: 0, ram_percent: 0 } })),
        axios.get('/api/stats/containers').catch(() => ({ data: [] }))
      ]);

      const now = Date.now();
      const newSys = sysRes.data;
      const containers = cRes.data.map(c => ({
        ...c,
        isHealthy: c.status?.toLowerCase().includes('up')
      }));

      setSystemMetrics(newSys);
      setAllStats(containers);

      setHistory(prev => {
        const next = { ...prev };
        containers.forEach(c => {
          if (!next[c.name]) next[c.name] = [];
          
          // Parse percentages e.g. "1.50%" -> 1.5, or handle N/A
          const cpuRaw = c.cpu_perc === 'N/A' ? 0 : parseFloat(c.cpu_perc.replace('%', ''));
          // Mem usage is tricky e.g. "150MiB / 200MiB", but the api provides MemUsage. To draw a chart we really need percentages.
          // Wait, 'docker stats --format' returns MemPerc natively!
          // But our current backend only returns `MemUsage`. I will map cpu_perc for the sparklines for now.
          const val = isNaN(cpuRaw) ? 0 : cpuRaw;

          next[c.name] = [...next[c.name], { time: now, cpu: val }].slice(-30); // keep last 30
        });
        return next;
      });
    } catch (err) {
      console.error('Metrics poll error', err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // 10s tick rate
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return (
    <MetricsContext.Provider value={{
      history,
      systemMetrics,
      allStats,
      isFetching,
      forceFetch: fetchMetrics
    }}>
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetricsHistory = () => {
  const context = useContext(MetricsContext);
  if (!context) throw new Error('useMetricsHistory must be used within MetricsProvider');
  return context;
};
