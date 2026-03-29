import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import axios from '../lib/axios';

const SystemMetrics = () => {
  const [metrics, setMetrics] = useState({ cpu_percent: 0, ram_percent: 0, disk_free_gb: 0 });

  useEffect(() => {
    let isMounted = true;
    
    const fetchMetrics = async () => {
      try {
        const { data } = await axios.get('/api/stats/system');
        if (isMounted) {
          setMetrics({ 
            cpu_percent: data.cpu_percent, 
            ram_percent: data.ram_percent, 
            disk_free_gb: data.disk_free_gb 
          });
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      }
    };


    const interval = setInterval(fetchMetrics, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getProgressColor = (percent) => {
    if (percent < 70) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (percent < 90) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
    return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
  };

  return (
    <div className="bg-[var(--color-dark-surface)] border border-[var(--color-dark-border)] rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-white">System Metrics</h2>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2 text-sm text-[var(--color-dark-muted)]">
              <Cpu className="w-4 h-4" />
              <span>CPU Usage</span>
            </div>
            <span className="text-sm font-medium text-white">{metrics.cpu_percent.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-[var(--color-dark-bg)] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(metrics.cpu_percent)}`} 
              style={{ width: `${metrics.cpu_percent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2 text-sm text-[var(--color-dark-muted)]">
              <MemoryStick className="w-4 h-4" />
              <span>RAM Usage</span>
            </div>
            <span className="text-sm font-medium text-white">{metrics.ram_percent.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-[var(--color-dark-bg)] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(metrics.ram_percent)}`} 
              style={{ width: `${metrics.ram_percent}%` }}
            />
          </div>
        </div>
        
        <div className="pt-2 border-t border-[var(--color-dark-border)] mt-4">
          <div className="flex items-center justify-between text-sm mt-4">
             <div className="flex items-center space-x-2 text-[var(--color-dark-muted)]">
               <HardDrive className="w-4 h-4" />
               <span>Free Disk Space</span>
             </div>
             <span className="text-white font-medium">{metrics.disk_free_gb} GB</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;
