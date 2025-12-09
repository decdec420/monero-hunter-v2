import { useEffect, useCallback } from 'react';
import { useStore } from '../store/store';

export function useStats() {
  const { stats, isMining, setStats, setMining } = useStore();

  useEffect(() => {
    // Listen for stats updates from main process
    (window as any).api.onStatsUpdate((newStats: any) => {
      setStats(newStats);
      setMining(newStats.isMining);
    });

    // Get initial status
    (window as any).api.getStatus().then((status: any) => {
      setMining(status.isMining);
    });
  }, [setStats, setMining]);

  const startMining = useCallback(async () => {
    await (window as any).api.startMining();
  }, []);

  const stopMining = useCallback(async () => {
    await (window as any).api.stopMining();
  }, []);

  return {
    stats,
    isMining,
    startMining,
    stopMining,
  };
}
