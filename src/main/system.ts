import { execSync } from 'child_process';
import os from 'os';

export interface SystemStats {
  cpuTemp: number;
  cpuLoad: number;
  powerSource: 'AC' | 'Battery';
}

export function getSystemStats(): SystemStats {
  const cpuTemp = getCPUTemp();
  const cpuLoad = getCPULoad();
  const powerSource = getPowerSource();

  return { cpuTemp, cpuLoad, powerSource };
}

function getCPUTemp(): number {
  // For Intel Macs, we can try using powermetrics or osx-cpu-temp
  // But these require elevated privileges or additional software
  // Alternative: Use SMC readings via istats gem or other tools
  
  try {
    // Try osx-cpu-temp if installed (brew install osx-cpu-temp)
    const output = execSync('osx-cpu-temp 2>/dev/null', { encoding: 'utf-8' });
    const match = output.match(/([\d.]+)°C/);
    if (match) return parseFloat(match[1]);
  } catch {
    // osx-cpu-temp not available
  }

  try {
    // Try istats if installed (gem install iStats)
    const output = execSync('istats cpu temp 2>/dev/null', { encoding: 'utf-8' });
    const match = output.match(/([\d.]+)°C/);
    if (match) return parseFloat(match[1]);
  } catch {
    // istats not available
  }

  try {
    // Fallback: estimate from CPU load (not accurate but gives some indication)
    const load = os.loadavg()[0] / os.cpus().length;
    // Rough estimate: idle ~50°C, full load ~90°C for Intel i5
    return 50 + (load * 40);
  } catch {
    return 60; // Default reasonable temp
  }
}

function getCPULoad(): number {
  const cpus = os.cpus();
  const loadAvg = os.loadavg()[0]; // 1-minute load average
  const numCores = cpus.length;
  
  // Load average as percentage of total cores
  return Math.min((loadAvg / numCores) * 100, 100);
}

function getPowerSource(): 'AC' | 'Battery' {
  try {
    const output = execSync('pmset -g batt', { encoding: 'utf-8' });
    return output.includes("'AC Power'") ? 'AC' : 'Battery';
  } catch {
    return 'AC'; // Assume AC if can't determine
  }
}
