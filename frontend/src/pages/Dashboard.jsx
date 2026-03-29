import SystemMetrics from '../components/SystemMetrics';
import ContainerStatusTable from '../components/ContainerStatusTable';
import ActionPanel from '../components/ActionPanel';

const Dashboard = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ContainerStatusTable />
      </div>
      <div className="flex flex-col gap-6">
        <SystemMetrics />
        <ActionPanel />
      </div>
    </div>
  );
};

export default Dashboard;
