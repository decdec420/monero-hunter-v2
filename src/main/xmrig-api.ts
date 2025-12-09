import axios from 'axios';

const API_URL = 'http://127.0.0.1:18088';

export interface XMRigStats {
  hashrate: number;
  shares: { accepted: number; rejected: number };
  uptime: number;
}

export async function getXMRigStats(): Promise<XMRigStats | null> {
  try {
    const response = await axios.get(`${API_URL}/2/summary`, { timeout: 5000 });
    const data = response.data;

    return {
      hashrate: data.hashrate?.total?.[0] || 0,
      shares: {
        accepted: data.results?.shares_good || 0,
        rejected: (data.results?.shares_total || 0) - (data.results?.shares_good || 0),
      },
      uptime: data.uptime || 0,
    };
  } catch (error) {
    // XMRig API not available yet (miner starting up or not running)
    return null;
  }
}
