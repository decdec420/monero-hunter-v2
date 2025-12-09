// Intel Mac-optimized profit calculations
// Intel Core i5 (2017) typically gets ~800-1200 H/s with XMRig

const MONERO_BLOCK_REWARD = 0.6; // Current approximate block reward
const BLOCKS_PER_DAY = 720; // 86400 seconds / 120 second block time
const NETWORK_HASHRATE = 2.5e9; // ~2.5 GH/s current network hashrate

// Intel Mac power consumption estimates
const POWER_DRAW_WATTS = 35; // Intel i5 CPU under mining load (higher than M1)
const ELECTRICITY_RATE = 0.12; // $/kWh (adjust for your location)

export interface ProfitMetrics {
  xmrPerDay: number;
  usdPerDay: number;
  netProfit: number;
}

export function calculateProfit(hashrate: number, xmrPrice: number): ProfitMetrics {
  // Calculate XMR earned per day based on hashrate share of network
  const shareOfNetwork = hashrate / NETWORK_HASHRATE;
  const xmrPerDay = shareOfNetwork * MONERO_BLOCK_REWARD * BLOCKS_PER_DAY;
  
  // Calculate USD value
  const usdPerDay = xmrPerDay * xmrPrice;
  
  // Calculate electricity cost
  // Power (kW) * Hours * Rate = Daily cost
  const electricityCostPerDay = (POWER_DRAW_WATTS / 1000) * 24 * ELECTRICITY_RATE;
  
  // Net profit after electricity
  const netProfit = usdPerDay - electricityCostPerDay;

  return {
    xmrPerDay,
    usdPerDay,
    netProfit,
  };
}
