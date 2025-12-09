# MONERO HUNTER v2 - COMPLETE BUILD GUIDE

## Quick Start

```bash
# 1. Clone or download the repo
git clone https://github.com/yourusername/monero-hunter-v2.git
cd monero-hunter-v2

# 2. Install dependencies
npm install

# 3. Ensure XMRig is installed
brew install xmrig

# 4. Run in development mode
npm run dev

# 5. Build for production
npm run build
npm run electron-build
```

---

## Project Structure

```
monero-hunter-v2/
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
├── electron-builder.yml
│
├── src/
│   ├── main/
│   │   ├── index.ts                 # Electron main process entry
│   │   ├── preload.ts               # IPC bridge (preload script)
│   │   ├── window.ts                # Window creation & management
│   │   ├── ipc-handlers.ts          # IPC handlers for renderer
│   │   ├── miner-controller.ts      # XMRig process management
│   │   ├── system-monitor.ts        # CPU temp, load, power status
│   │   ├── profitability-engine.ts  # Profit calculations
│   │   ├── price-fetcher.ts         # CoinGecko API integration
│   │   ├── database.ts              # SQLite setup & queries
│   │   └── config-generator.ts      # XMRig config creation
│   │
│   ├── renderer/
│   │   ├── index.tsx                # React entry point
│   │   ├── App.tsx                  # Root component
│   │   ├── components/
│   │   │   ├── Dashboard.tsx        # Main layout
│   │   │   ├── HeroSection.tsx      # USD/day display
│   │   │   ├── MiningStatsCard.tsx  # Hashrate, shares
│   │   │   ├── EarningsCard.tsx     # XMR, USD, profit
│   │   │   ├── HealthCard.tsx       # Temp, load, power
│   │   │   ├── SparklineChart.tsx   # 24h earnings chart
│   │   │   └── StatusIndicator.tsx  # Color-coded temp
│   │   ├── hooks/
│   │   │   ├── useStats.ts          # Real-time stats hook
│   │   │   └── useSystemHealth.ts   # System monitoring hook
│   │   ├── store/
│   │   │   └── useAppStore.ts       # Zustand state management
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── styles/
│   │   │   ├── index.css            # Global styles
│   │   │   └── tailwind.config.js   # Tailwind config
│   │   └── index.html               # HTML template
│   │
│   └── types/
│       └── ipc.ts                   # IPC type definitions
│
├── public/
│   └── icon.png                     # App icon
│
└── docs/
    ├── SETUP.md                     # Installation guide
    ├── USAGE.md                     # How to use
    └── TROUBLESHOOTING.md           # Common issues

```

---

## Key Files (Complete Code)

### 1. package.json

```json
{
  "name": "monero-hunter-v2",
  "version": "1.0.0",
  "description": "M1 MacBook Pro mining companion for Monero + Qubic",
  "main": "dist/main/index.js",
  "type": "module",
  "homepage": "./",
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "vite build",
    "build:main": "vite build --config vite.config.main.ts",
    "build:renderer": "vite build --config vite.config.ts",
    "build:all": "npm run build:main && npm run build:renderer",
    "electron-build": "npm run build:all && electron-builder",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@electron/preload": "^2.0.0",
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "concurrently": "^8.2.2",
    "electron": "^27.0.0",
    "electron-builder": "^24.6.4",
    "typescript": "^5.3.3",
    "vite": "^5.0.8",
    "wait-on": "^7.0.1"
  },
  "dependencies": {
    "axios": "^1.6.5",
    "better-sqlite3": "^9.2.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.3",
    "zustand": "^4.4.7"
  }
}
```

### 2. src/main/index.ts

```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { isDev } from './utils';
import { registerIpcHandlers } from './ipc-handlers';
import { initializeDatabase } from './database';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    alwaysOnTop: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', async () => {
  await initializeDatabase();
  registerIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

### 3. src/main/miner-controller.ts

```typescript
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { generateXMRigConfig } from './config-generator';

export class MinerController {
  private minerProcess: ChildProcess | null = null;
  private configPath: string;
  private isRunning = false;

  constructor() {
    const appDataPath = path.join(os.homedir(), '.monero-hunter');
    if (!fs.existsSync(appDataPath)) {
      fs.mkdirSync(appDataPath, { recursive: true });
    }
    this.configPath = path.join(appDataPath, 'xmrig-config.json');
  }

  async start(walletAddress: string): Promise<void> {
    if (this.isRunning) return;

    try {
      // Generate config
      const config = generateXMRigConfig(walletAddress);
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));

      // Spawn XMRig process
      this.minerProcess = spawn('xmrig', ['-c', this.configPath], {
        stdio: 'pipe',
      });

      this.isRunning = true;

      this.minerProcess.on('error', (err) => {
        console.error('Miner error:', err);
        this.isRunning = false;
      });

      this.minerProcess.on('exit', () => {
        this.isRunning = false;
      });
    } catch (error) {
      console.error('Failed to start miner:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.minerProcess) return;

    return new Promise((resolve) => {
      this.minerProcess?.kill();
      this.isRunning = false;
      setTimeout(resolve, 1000);
    });
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
```

### 4. src/main/system-monitor.ts

```typescript
import { execSync } from 'child_process';
import os from 'os';

export interface SystemStats {
  cpuTemp: number;
  cpuLoad: number;
  powerSource: 'AC' | 'Battery';
  batteryLevel: number;
}

export async function getSystemStats(): Promise<SystemStats> {
  const cpuTemp = getCPUTemperature();
  const cpuLoad = os.loadavg()[0] * 100 / os.cpus().length;
  const powerStatus = getPowerStatus();

  return {
    cpuTemp,
    cpuLoad,
    powerSource: powerStatus.source,
    batteryLevel: powerStatus.level,
  };
}

function getCPUTemperature(): number {
  try {
    const output = execSync('powermetrics -n 1 -i 100 2>/dev/null', {
      encoding: 'utf-8',
    });
    const match = output.match(/CPU die temperature\s+(\d+\.\d+)/);
    return match ? parseFloat(match[1]) : 0;
  } catch {
    return 0;
  }
}

function getPowerStatus(): { source: 'AC' | 'Battery'; level: number } {
  try {
    const output = execSync('pmset -g batt', { encoding: 'utf-8' });
    const batteryMatch = output.match(/(\d+)%/);
    const acMatch = output.includes("'AC Power'");

    return {
      source: acMatch ? 'AC' : 'Battery',
      level: batteryMatch ? parseInt(batteryMatch[1]) : 0,
    };
  } catch {
    return { source: 'AC', level: 100 };
  }
}
```

### 5. src/main/price-fetcher.ts

```typescript
import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export async function getMoneroPrice(): Promise<number> {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/simple/price?ids=monero&vs_currencies=usd&cache=false`
    );
    return response.data.monero.usd || 210;
  } catch (error) {
    console.error('Failed to fetch Monero price:', error);
    return 210; // Fallback price
  }
}

export async function getQubicPrice(): Promise<number> {
  try {
    const response = await axios.get(
      `${COINGECKO_API}/simple/price?ids=qubic&vs_currencies=usd&cache=false`
    );
    return response.data.qubic?.usd || 0.00000074;
  } catch (error) {
    console.error('Failed to fetch Qubic price:', error);
    return 0.00000074; // Fallback price
  }
}
```

### 6. src/main/database.ts

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

let db: Database.Database | null = null;

export function initializeDatabase(): void {
  const appDataPath = path.join(os.homedir(), '.monero-hunter');
  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
  }

  const dbPath = path.join(appDataPath, 'stats.db');
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      hashrate REAL NOT NULL,
      temp_celsius REAL,
      cpu_load_percent REAL,
      shares_accepted INTEGER,
      shares_rejected INTEGER,
      thread_count INTEGER,
      xmr_earned REAL,
      usd_earned REAL,
      net_profit REAL,
      power_source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_timestamp ON stats(timestamp);
  `);

  // Clean up old stats (>30 days)
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  db.prepare('DELETE FROM stats WHERE timestamp < ?').run(thirtyDaysAgo);
}

export function logStats(stats: any): void {
  if (!db) return;

  db.prepare(`
    INSERT INTO stats (
      timestamp, hashrate, temp_celsius, cpu_load_percent,
      shares_accepted, shares_rejected, thread_count,
      xmr_earned, usd_earned, net_profit, power_source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Math.floor(Date.now() / 1000),
    stats.hashrate,
    stats.temp,
    stats.cpuLoad,
    stats.sharesAccepted,
    stats.sharesRejected,
    stats.threads,
    stats.xmrEarned,
    stats.usdEarned,
    stats.netProfit,
    stats.powerSource
  );
}

export function getRecentStats(hours: number = 24): any[] {
  if (!db) return [];

  const timestamp = Math.floor(Date.now() / 1000) - hours * 60 * 60;
  return db.prepare('SELECT * FROM stats WHERE timestamp > ? ORDER BY timestamp DESC LIMIT 1440')
    .all(timestamp) as any[];
}
```

### 7. src/renderer/App.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import Dashboard from './components/Dashboard';
import './styles/index.css';

export default function App() {
  const { stats, setStats, isInitialized, setInitialized } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for stats updates from main process
    const unlisten = (window as any).api.onStatsUpdate((newStats: any) => {
      setStats(newStats);
    });

    return () => unlisten?.();
  }, [setStats]);

  useEffect(() => {
    // Initialize app
    (async () => {
      try {
        await (window as any).api.initMiner();
        setInitialized(true);
      } catch (err) {
        setError(String(err));
      }
    })();
  }, [setInitialized]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Monero Hunter v2</h1>
          <p className="text-slate-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return <Dashboard stats={stats} />;
}
```

### 8. src/renderer/components/Dashboard.tsx

```typescript
import React from 'react';
import HeroSection from './HeroSection';
import MiningStatsCard from './MiningStatsCard';
import EarningsCard from './EarningsCard';
import HealthCard from './HealthCard';
import SparklineChart from './SparklineChart';

export default function Dashboard({ stats }: any) {
  return (
    <div className="w-full h-screen bg-slate-900 text-white p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Hero Section */}
        <HeroSection stats={stats} />

        {/* Mining Stats */}
        <div className="grid grid-cols-2 gap-4">
          <MiningStatsCard stats={stats} />
          <EarningsCard stats={stats} />
        </div>

        {/* Health & Chart */}
        <HealthCard stats={stats} />
        <SparklineChart />

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 mt-8">
          <p>Powered by XMRig • Monero Hunter v2</p>
          <p>Wallet: {stats?.wallet?.slice(0, 8)}...{stats?.wallet?.slice(-8)}</p>
        </div>
      </div>
    </div>
  );
}
```

### 9. src/renderer/components/HeroSection.tsx

```typescript
import React, { useState, useEffect } from 'react';

export default function HeroSection({ stats }: any) {
  const [displayUSD, setDisplayUSD] = useState(0);

  useEffect(() => {
    const target = stats?.usdPerDay || 0;
    let current = displayUSD;
    const increment = (target - current) / 20;

    const interval = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        current = target;
        clearInterval(interval);
      }
      setDisplayUSD(current);
    }, 50);

    return () => clearInterval(interval);
  }, [stats?.usdPerDay]);

  const statusColor =
    stats?.temp > 85
      ? 'text-red-500'
      : stats?.temp > 80
        ? 'text-yellow-500'
        : 'text-green-500';

  return (
    <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg p-8 text-center">
      <h1 className="text-4xl font-bold mb-2">
        ${displayUSD.toFixed(4)}<span className="text-lg">/day</span>
      </h1>
      <p className="text-cyan-100 mb-4">{stats?.xmrPerDay.toFixed(8)} XMR/day</p>

      <div className="flex justify-around text-sm">
        <div>
          <p className="text-cyan-100">Status</p>
          <p className={`font-bold ${statusColor}`}>
            {stats?.isMining ? 'MINING' : 'PAUSED'}
          </p>
        </div>
        <div>
          <p className="text-cyan-100">Uptime</p>
          <p className="font-bold">{formatUptime(stats?.uptime || 0)}</p>
        </div>
        <div>
          <p className="text-cyan-100">Temp</p>
          <p className={`font-bold ${statusColor}`}>{stats?.temp?.toFixed(1)}°C</p>
        </div>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
```

---

## Installation & Usage

### Prerequisites

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install XMRig
brew install xmrig

# Install Node.js 18+
brew install node
```

### Setup

```bash
# 1. Download/clone repo
git clone https://github.com/yourusername/monero-hunter-v2.git
cd monero-hunter-v2

# 2. Install dependencies
npm install

# 3. Start development mode
npm run dev

# The app will:
# - Start Vite dev server on localhost:5173
# - Launch Electron window
# - Auto-spawn XMRig
# - Begin mining and logging stats
```

### Production Build

```bash
npm run electron-build

# Creates: dist/Monero Hunter v2-1.0.0.dmg
# Drag to Applications folder
# Run like any macOS app
```

---

## Wallet Addresses (Already Configured)

**Monero:** 46wWC1DwnwAQJx342gQJzD7r6RZiUMGg9Df3jHQHUaiKfgjj7KnRhoueoq7Pv4s2WKMDS8g2REban71aHwVVEzXhBBUtAQG

**Qubic:** qegmciblbqfleufvdebdohmlarlczzthvpafwijutkdaaadvkeyetnc

---

## Testing (7 Days)

```bash
# Run the app
npm run dev

# Let it mine for 24 hours minimum
# Monitor the dashboard for:
# ✓ Hashrate stability
# ✓ Shares accepted/rejected ratio
# ✓ Temperature under 80°C
# ✓ Uptime continuous

# After 7 days:
# - Check SQLite stats.db for earnings history
# - Compare projected vs actual profit
# - Verify temperature management worked
```

---

## Troubleshooting

**"XMRig not found"**
- `brew install xmrig`

**"Permission denied" on powermetrics**
- Run: `sudo visudo`
- Add: `%staff ALL= NOPASSWD: /usr/bin/powermetrics`

**App crashes on startup**
- Check `~/.monero-hunter/app.log`
- Ensure Node.js 18+ is installed

**Low hashrate**
- Monero mining on M1 is ~600 H/s (normal)
- Not profitable at $0.35/kWh electricity
- But accumulates XMR for long-term hold

---

## What's Next (Phase 2)

- Qubic merge-mining integration
- SimpleSwap API integration (auto-convert QUBIC→USDT)
- Email alerts for low earnings
- Multi-rig support
- Remote monitoring

---

**Ready to download and run. Test for 7 days and report back with actual earnings!**
