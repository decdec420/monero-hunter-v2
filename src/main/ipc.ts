import { ipcMain, BrowserWindow } from 'electron';
import { startMining, stopMining, isMining, getMinerStats } from './miner';
import { getSystemStats } from './system';
import { calculateProfit } from './profit';
import { getXMRigStats } from './xmrig-api';

let statsInterval: NodeJS.Timeout | null = null;

export function setupIPC(): void {
  ipcMain.handle('start-mining', async () => {
    const success = await startMining();
    if (success) {
      startStatsUpdates();
    }
    return { success };
  });

  ipcMain.handle('stop-mining', async () => {
    const success = stopMining();
    if (success) {
      stopStatsUpdates();
    }
    return { success };
  });

  ipcMain.handle('get-status', () => {
    return {
      isMining: isMining(),
    };
  });
}

function startStatsUpdates(): void {
  if (statsInterval) return;

  statsInterval = setInterval(async () => {
    const xmrigStats = await getXMRigStats();
    const systemStats = getSystemStats();
    
    // Get XMR price (hardcoded for now, can be fetched from API)
    const xmrPrice = 165;
    const profitMetrics = calculateProfit(xmrigStats?.hashrate || 0, xmrPrice);

    const stats = {
      isMining: isMining(),
      hashrate: xmrigStats?.hashrate || 0,
      shares: xmrigStats?.shares || { accepted: 0, rejected: 0 },
      uptime: xmrigStats?.uptime || 0,
      cpuTemp: systemStats.cpuTemp,
      cpuLoad: systemStats.cpuLoad,
      powerSource: systemStats.powerSource,
      xmrPerDay: profitMetrics.xmrPerDay,
      usdPerDay: profitMetrics.usdPerDay,
      netProfit: profitMetrics.netProfit,
    };

    // Send to all windows
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      win.webContents.send('stats-update', stats);
    }
  }, 2000);
}

function stopStatsUpdates(): void {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
}
