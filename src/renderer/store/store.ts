import { create } from 'zustand';

export interface MinerStats {
  hashrate: number;
  shares: {
    accepted: number;
    rejected: number;
  };
  uptime: number;
  cpuTemp: number;
  cpuLoad: number;
  powerSource: 'AC' | 'Battery';
  xmrPerDay: number;
  usdPerDay: number;
  netProfit: number;
  isMining: boolean;
}

interface StoreState {
  stats: MinerStats | null;
  isMining: boolean;
  setStats: (stats: MinerStats) => void;
  setMining: (isMining: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  stats: null,
  isMining: false,
  setStats: (stats) => set({ stats }),
  setMining: (isMining) => set({ isMining }),
}));
