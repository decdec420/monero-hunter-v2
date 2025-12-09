import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer
const api = {
  startMining: () => ipcRenderer.invoke('start-mining'),
  stopMining: () => ipcRenderer.invoke('stop-mining'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  onStatsUpdate: (callback: (stats: unknown) => void) => {
    ipcRenderer.on('stats-update', (_event, stats) => callback(stats));
    // Return a cleanup function
    return () => {
      ipcRenderer.removeAllListeners('stats-update');
    };
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);

// TypeScript declaration for the window.api
declare global {
  interface Window {
    api: typeof api;
  }
}
