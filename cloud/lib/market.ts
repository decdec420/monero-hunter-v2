import type { Market } from './economics';
// Parse provider payloads at the boundary. XMRig's observation timestamp is `ts` (milliseconds).
export function parseMarket(network: any, price: any, now=Date.now()): Market {
  if (network?.coin !== 'XMR' || network?.algo !== 'rx/0' || !Number.isFinite(network.difficulty) || network.difficulty <= 0 || !Number.isFinite(network.target) || network.target <= 0) throw new Error('Invalid Monero network response.');
  if (!Number.isFinite(network.ts) || !Number.isFinite(price?.monero?.last_updated_at)) throw new Error('Source timestamps are required.');
  const sourceAt=Math.min(price.monero.last_updated_at*1000,network.ts);
  const m: Market={price:price.monero.usd,network:network.difficulty/network.target,sourceAt,capturedAt:now,priceSource:price.source==='Kraken'?'Kraken':'CoinGecko'};
  if (![m.price,m.network,m.sourceAt].every(v=>Number.isFinite(v)&&v>0) || network.ts>now+60_000 || price.monero.last_updated_at*1000>now+60_000 || now-m.sourceAt>15*60_000) throw new Error('Market data is invalid, future-dated, or stale.');
  return m;
}
// Use the last candle containing a trade, never a no-trade carry-forward candle.
// The source time is its start, conservatively up to 60s older than the actual trade.
export function parseKrakenPrice(data:any) {
  if (!Array.isArray(data?.error) || data.error.length) throw new Error('Kraken price feed returned an error.');
  const rows=data.result?.XXMRZUSD??data.result?.XMRUSD;
  if(!Array.isArray(rows))throw new Error('Kraken XMR/USD candles are missing.');
  const candle=[...rows].reverse().find(row=>Array.isArray(row)&&row.length>=8&&Number(row[7])>0);
  if(!candle||!Number.isFinite(candle[0])||!Number.isFinite(Number(candle[4]))||Number(candle[4])<=0)throw new Error('Kraken has no usable XMR/USD trade.');
  return {source:'Kraken',monero:{usd:Number(candle[4]),last_updated_at:candle[0]}};
}
