import { getDb } from '@/db';
import { devices } from '@/db/schema';
import { body,failure } from '@/lib/server';
export async function POST(req:Request) {try {
  const d=await body(req);
  if(typeof d.id!=='string'|| !/^[a-zA-Z0-9_-]{1,80}$/.test(d.id)||typeof d.name!=='string'||!d.name.trim()||d.name.length>80||typeof d.algorithm!=='string'||d.algorithm.length>30)throw new Error('Invalid device identity.');
  for(const k of ['hashrate','uptime','accepted','rejected'])if(typeof d[k]!=='number'||!Number.isFinite(d[k])||d[k]<0||d[k]>1e15)throw new Error('Invalid device metrics.');
  for(const k of ['watts','temperature'])if(d[k]!==null&&(typeof d[k]!=='number'||!Number.isFinite(d[k])||d[k]<0||d[k]>100000))throw new Error('Invalid sensor value. Use null when unavailable.');
  const payload={id:d.id,name:d.name,hashrate:d.hashrate,algorithm:d.algorithm,uptime:d.uptime,accepted:d.accepted,rejected:d.rejected,watts:d.watts,temperature:d.temperature};
  const receivedAt=Date.now();await getDb().insert(devices).values({id:d.id,payload:JSON.stringify(payload),receivedAt}).onConflictDoUpdate({target:devices.id,set:{payload:JSON.stringify(payload),receivedAt}});return Response.json({ok:true,receivedAt});
}catch(e){return failure(e);}}
