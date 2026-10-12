import type { Market } from './economics';
// Parse provider payloads at the boundary. XMRig's observation timestamp is `ts` (milliseconds).
export function parseMarket(network: any, price: any, now=Date.now()): Market {
  if (network?.coin !== 'XMR' || network?.algo !== 'rx/0' || !Number.isFinite(network.difficulty) || network.difficulty <= 0 || !Number.isFinite(network.target) || network.target <= 0) throw new Error('Invalid Monero network response.');
  if (!Number.isFinite(network.ts) || !Number.isFinite(price?.monero?.last_updated_at)) throw new Error('Source timestamps are required.');
  const sourceAt=Math.min(price.monero.last_updated_at*1000,network.ts);
  const m: Market={price:price.monero.usd,network:network.difficulty/network.target,sourceAt,capturedAt:now};
  if (![m.price,m.network,m.sourceAt].every(v=>Number.isFinite(v)&&v>0) || network.ts>now+60_000 || price.monero.last_updated_at*1000>now+60_000 || now-m.sourceAt>15*60_000) throw new Error('Market data is invalid, future-dated, or stale.');
  return m;
}
