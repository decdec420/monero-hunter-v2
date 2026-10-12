import { getDb } from '@/db';
import { ledger } from '@/db/schema';
import { or,eq } from 'drizzle-orm';
import { validateEntry } from '@/lib/economics';
import { body,failure } from '@/lib/server';
export async function POST(req:Request) {try {const entry=validateEntry(await body(req));const db=getDb();await db.insert(ledger).values({...entry,createdAt:Date.now()}).onConflictDoNothing();const [saved]=await db.select().from(ledger).where(or(eq(ledger.id,entry.id),eq(ledger.reference,entry.reference)));if(!saved||saved.id!==entry.id||saved.cents!==entry.cents||saved.kind!==entry.kind||saved.description!==entry.description||saved.reference!==entry.reference||saved.occurredAt!==entry.occurredAt)return failure(new Error('That entry ID or reference already exists with different details.'),409);return Response.json({ok:true});}catch(e){return failure(e);}}
