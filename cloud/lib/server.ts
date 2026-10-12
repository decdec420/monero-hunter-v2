import { getDb } from '@/db';
import { observations } from '@/db/schema';
import { desc } from 'drizzle-orm';
import type { Market } from './economics';
import { parseMarket } from './market';
export function checkWrite(req: Request) {
  // Owner-private Sites dispatch enforces authentication before this Worker.
  // Do not change the audience without adding application-level authorization.
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) throw new Error('Cross-origin changes are blocked.');
  if (req.headers.get('sec-fetch-site') === 'cross-site') throw new Error('Cross-site changes are blocked.');
  if (!req.headers.get('content-type')?.includes('application/json')) throw new Error('JSON is required.');
}
export async function body(req: Request) {
  checkWrite(req);
  const text = await req.text();
  if (text.length > 16384) throw new Error('Request is too large.');
  return JSON.parse(text);
}
export function failure(e: unknown, status=400) { return Response.json({error:e instanceof Error ? e.message : 'Request failed.'},{status,headers:{'Cache-Control':'no-store'}}); }
async function fetchJson(url: string) {
  const response = await fetch(url,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error(`Upstream service returned ${response.status}.`);
  return response.json() as Promise<any>;
}
export async function market(): Promise<{market:Market|null;error:string|null}> {
  const db = getDb();
  const [cached] = await db.select().from(observations).orderBy(desc(observations.bucket)).limit(1);
  const now = Date.now();
  if (cached && now-cached.capturedAt<120_000) return {market:cached,error:null};
  try {
    const [network,price] = await Promise.all([
      fetchJson('https://api.xmrig.com/1/network/XMR'),
      fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=usd&include_last_updated_at=true')
    ]);
    const m = parseMarket(network,price,now);
    await db.insert(observations).values({...m,bucket:Math.floor(now/120_000)}).onConflictDoNothing();
    return {market:m,error:null};
  } catch {return {market:cached??null,error:'Live sources unavailable. Last valid observation is shown; stale data blocks qualification.'};}
}
