export const FRESH_MS = 15 * 60 * 1000;
export type Market = { price: number; network: number; sourceAt: number; capturedAt: number; priceSource?: string };
export type Plan = { id: string; name: string; kind: 'owned'|'rental'; hashrate: number; watts: number; tariff: number; rentHourly: number; overheadMonthly: number; upfront: number; termDays: number; poolPct: number; minerPct: number; sellPct: number; uptimePct: number; measured: boolean; costsConfirmed: boolean; algorithm: string };
export type Entry = { id: string; kind: 'receipt'|'expense'; cents: number; description: string; reference: string; occurredAt: string; createdAt: number };
export type Device = { id: string; name: string; hashrate: number; algorithm: string; uptime: number; accepted: number; rejected: number; watts: number|null; temperature: number|null; receivedAt: number };
export type Assessment = { gross: number; revenue: number; cost: number; operatingCost: number; net: number; stressNet: number; stressMargin: number; maxRentHourly: number; paybackDays: number|null; status: 'blocked'|'reject'|'candidate'; reasons: string[] };
export function validatePlan(input: unknown): Plan {
  if (!input || typeof input !== 'object') throw new Error('An opportunity is required.');
  const p = input as Plan;
  if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 80) throw new Error('Name must be 1–80 characters.');
  if (!['owned','rental'].includes(p.kind)) throw new Error('Choose an owned machine or a rental.');
  for (const k of ['hashrate','watts','tariff','rentHourly','overheadMonthly','upfront','termDays','poolPct','minerPct','sellPct','uptimePct'] as const) {
    if (typeof p[k] !== 'number' || !Number.isFinite(p[k]) || p[k] < 0 || p[k] > 1e9) throw new Error(`${k} must be a finite, nonnegative number.`);
  }
  if (p.hashrate <= 0 || p.termDays < 1 || p.termDays > 3650 || p.uptimePct <= 0 || p.uptimePct > 100) throw new Error('Hashrate, duration, and uptime must be positive and within range.');
  for (const k of ['poolPct','minerPct','sellPct'] as const) if (p[k] >= 100) throw new Error('Each fee must be below 100%.');
  if (typeof p.measured !== 'boolean' || typeof p.costsConfirmed !== 'boolean' || typeof p.algorithm !== 'string' || p.algorithm.length > 30) throw new Error('Evidence and algorithm fields are required.');
  return { ...p, id: typeof p.id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(p.id) ? p.id : '', name: p.name.trim() };
}
export function isFresh(m: Market|null, now = Date.now()): m is Market {
  return !!m && Number.isFinite(m.price) && m.price > 0 && Number.isFinite(m.network) && m.network > 0 && Number.isFinite(m.sourceAt) && m.sourceAt <= now+60_000 && now-m.sourceAt <= FRESH_MS;
}
// Baseline tail emission: 0.6 XMR * 720 blocks/day. No transaction-fee windfall assumed.
// Only rx/0 H/s are comparable to Monero network H/s.
export function assess(p: Plan, m: Market|null, now = Date.now()): Assessment|null {
  validatePlan(p);
  if (!m || !Number.isFinite(m.price) || m.price <= 0 || !Number.isFinite(m.network) || m.network <= 0 || p.algorithm !== 'rx/0') return null;
  const gross = p.hashrate / m.network * 432 * m.price * p.uptimePct / 100;
  const revenue = gross * (1-p.poolPct/100) * (1-p.minerPct/100) * (1-p.sellPct/100);
  // Costs accrue 24h including downtime. Rental electricity is included; extras go in overhead.
  const operatingCost = (p.kind === 'owned' ? p.watts/1000*24*p.tariff : p.rentHourly*24) + p.overheadMonthly/30;
  const cost = operatingCost + p.upfront/p.termDays;
  const stressRevenue = revenue*.75;
  const stressCost = cost*1.10;
  const stressNet = stressRevenue-stressCost;
  const stressMargin = stressRevenue > 0 ? stressNet/stressRevenue : -1;
  const reasons: string[] = [];
  if (!isFresh(m,now)) reasons.push('Market data is stale.');
  if (!p.measured) reasons.push('Sustained RandomX hashrate has not been measured.');
  if (!p.costsConfirmed) reasons.push('All operating and upfront costs need confirmation.');
  const evidenceBlocked = reasons.length > 0;
  if (stressNet <= 0) reasons.push('Negative return in the stress scenario.');
  else if (stressMargin < .20) reasons.push('Less than 20% margin in the stress scenario.');
  return { gross, revenue, cost, operatingCost, net: revenue-cost, stressNet, stressMargin,
    maxRentHourly: Math.max(0,(stressRevenue*.8/1.10 - p.overheadMonthly/30 - p.upfront/p.termDays)/24),
    paybackDays: p.upfront > 0 && revenue > operatingCost ? p.upfront/(revenue-operatingCost) : null,
    status: evidenceBlocked ? 'blocked' : stressNet > 0 && stressMargin >= .20 ? 'candidate' : 'reject', reasons };
}
export function cashTotals(entries: Entry[]) {
  const receipts = entries.filter(e=>e.kind==='receipt').reduce((n,e)=>n+e.cents,0);
  const expenses = entries.filter(e=>e.kind==='expense').reduce((n,e)=>n+e.cents,0);
  return { receipts: receipts/100, expenses: expenses/100, net: (receipts-expenses)/100 };
}
export function validateEntry(input: unknown): Omit<Entry,'createdAt'> {
  if (!input || typeof input !== 'object') throw new Error('A cash entry is required.');
  const p = input as Entry;
  if (!['receipt','expense'].includes(p.kind) || !Number.isSafeInteger(p.cents) || p.cents <= 0 || p.cents > 1e10) throw new Error('Enter a positive USD amount with at most two decimal places.');
  if (typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(p.id)) throw new Error('Invalid entry ID.');
  if (typeof p.description !== 'string' || !p.description.trim() || p.description.length > 200 || typeof p.reference !== 'string' || !p.reference.trim() || p.reference.length > 120) throw new Error('Add a description and a unique receipt or invoice reference.');
  if (typeof p.occurredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.occurredAt) || !Number.isFinite(Date.parse(p.occurredAt)) || new Date(p.occurredAt).toISOString().slice(0,10)!==p.occurredAt || p.occurredAt > new Date().toISOString().slice(0,10)) throw new Error('Enter a valid date that is not in the future.');
  return {id:p.id,kind:p.kind,cents:p.cents,description:p.description.trim(),reference:p.reference.trim(),occurredAt:p.occurredAt};
}
