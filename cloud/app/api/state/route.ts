import { getDb } from '@/db';
import { plans,ledger,devices,observations } from '@/db/schema';
import { desc,gte } from 'drizzle-orm';
import { market,failure } from '@/lib/server';
export async function GET() {
  try {
    const live = await market();const db=getDb();
    const [p,l,d,h]=await Promise.all([db.select().from(plans).orderBy(desc(plans.createdAt)),db.select().from(ledger).orderBy(desc(ledger.occurredAt),desc(ledger.createdAt)),db.select().from(devices),db.select().from(observations).where(gte(observations.capturedAt,Date.now()-86400000)).orderBy(desc(observations.bucket)).limit(720)]);
    return Response.json({...live,plans:p.map(v=>JSON.parse(v.payload)),ledger:l,devices:d.map(v=>({...JSON.parse(v.payload),receivedAt:v.receivedAt})),history:h.reverse(),serverTime:Date.now(),execution:'disabled'},{headers:{'Cache-Control':'no-store'}});
  } catch(e) {return failure(e,503);}
}
