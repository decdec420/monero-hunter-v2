import { getDb } from '@/db';
import { plans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validatePlan } from '@/lib/economics';
import { body,failure } from '@/lib/server';
export async function POST(req:Request) {try {const p=validatePlan(await body(req));p.id ||= crypto.randomUUID();await getDb().insert(plans).values({id:p.id,payload:JSON.stringify(p),createdAt:Date.now()}).onConflictDoUpdate({target:plans.id,set:{payload:JSON.stringify(p)}});return Response.json({id:p.id});}catch(e){return failure(e);}}
export async function DELETE(req:Request) {try {const b=await body(req);if(typeof b.id!=='string'||b.id.length>80)throw new Error('Invalid ID.');await getDb().delete(plans).where(eq(plans.id,b.id));return Response.json({ok:true});}catch(e){return failure(e);}}
