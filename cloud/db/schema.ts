import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
export const plans = sqliteTable('plans', { id: text('id').primaryKey(), payload: text('payload').notNull(), createdAt: integer('created_at').notNull() });
export const ledger = sqliteTable('ledger', { id: text('id').primaryKey(), kind: text('kind').notNull(), cents: integer('cents').notNull(), description: text('description').notNull(), reference: text('reference').notNull().unique(), occurredAt: text('occurred_at').notNull(), createdAt: integer('created_at').notNull() });
export const observations = sqliteTable('observations', { bucket: integer('bucket').primaryKey(), price: real('price').notNull(), network: real('network').notNull(), sourceAt: integer('source_at').notNull(), capturedAt: integer('captured_at').notNull() });
export const devices = sqliteTable('devices', { id: text('id').primaryKey(), payload: text('payload').notNull(), receivedAt: integer('received_at').notNull() });
