import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';

export default function App() {
  const [stats, setStats] = useState<any>(null);
  const [isMining, setIsMining] = useState(false);

  useEffect(() => {
    (window as any).api.onStatsUpdate((newStats: any) => {
      setStats(newStats);
      setIsMining(newStats.isMining);
    });

    (window as any).api.getStatus().then((status: any) => {
      setIsMining(status.isMining);
    });
  }, []);

  const handleStartMining = async () => {
    await (window as any).api.startMining();
  };

  const handleStopMining = async () => {
    await (window as any).api.stopMining();
  };

  return (
    <Dashboard
      stats={stats}
      isMining={isMining}
      onStart={handleStartMining}
      onStop={handleStopMining}
    />
  );
}
