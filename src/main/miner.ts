import { spawn, ChildProcess, execSync } from 'child_process';

let minerProcess: ChildProcess | null = null;

// XMRig configuration for Intel Mac
const XMRIG_CONFIG = {
  pool: 'gulf.moneroocean.stream:10128',
  wallet: '4Adh77JxUpWNNZgMemPdEPWLeUE4KvMP52jzhYqV9uDn518FNhT37CHcJbhRMaDT7BLEsxKsZjt4NV1UxFGAR6p7RNFsT43',
  threads: 2, // Optimal for Intel i5 dual-core
};

function findXMRig(): string {
  // Try to find xmrig in common locations
  const possiblePaths = [
    '/opt/homebrew/bin/xmrig',
    '/usr/local/bin/xmrig',
    '/usr/bin/xmrig',
  ];

  for (const path of possiblePaths) {
    try {
      execSync(`test -f ${path}`);
      return path;
    } catch {
      // Continue to next path
    }
  }

  // Try which command
  try {
    const result = execSync('which xmrig', { encoding: 'utf-8' }).trim();
    if (result) return result;
  } catch {
    // xmrig not in PATH
  }

  throw new Error('XMRig not found. Please install it with: brew install xmrig');
}

export async function startMining(): Promise<boolean> {
  if (minerProcess) {
    console.log('Miner already running');
    return true;
  }

  try {
    const xmrigPath = findXMRig();
    console.log(`Starting XMRig from: ${xmrigPath}`);

    const args = [
      '-o', XMRIG_CONFIG.pool,
      '-u', XMRIG_CONFIG.wallet,
      '-p', 'x',
      '-t', String(XMRIG_CONFIG.threads),
      '--http-host', '127.0.0.1',
      '--http-port', '18088',
      '--keepalive',
    ];

    minerProcess = spawn(xmrigPath, args, {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    minerProcess.stdout?.on('data', (data) => {
      console.log(`XMRig: ${data}`);
    });

    minerProcess.stderr?.on('data', (data) => {
      console.error(`XMRig error: ${data}`);
    });

    minerProcess.on('close', (code) => {
      console.log(`XMRig exited with code ${code}`);
      minerProcess = null;
    });

    minerProcess.on('error', (err) => {
      console.error('Failed to start XMRig:', err);
      minerProcess = null;
    });

    // Wait a moment for the process to start
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return minerProcess !== null;
  } catch (error) {
    console.error('Failed to start miner:', error);
    return false;
  }
}

export function stopMining(): boolean {
  if (!minerProcess) {
    console.log('Miner not running');
    return true;
  }

  try {
    minerProcess.kill('SIGTERM');
    minerProcess = null;
    console.log('Miner stopped');
    return true;
  } catch (error) {
    console.error('Failed to stop miner:', error);
    return false;
  }
}

export function isMining(): boolean {
  return minerProcess !== null;
}

export function getMinerStats(): { hashrate: number } | null {
  if (!minerProcess) return null;
  return { hashrate: 0 }; // Stats come from XMRig API
}
