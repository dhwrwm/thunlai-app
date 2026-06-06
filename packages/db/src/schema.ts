import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  uuid,
  customType,
} from 'drizzle-orm/pg-core';

// tsvector is a Postgres-native type not in Drizzle's pg-core — declare it so
// the fts column is included in the table type and can be used in sql`` queries.
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const recording_status = pgEnum('recording_status', [
  'pending',
  'approved',
  'rejected',
]);

export const words = pgTable('words', {
  id: serial('id').primaryKey(),
  bodo: text('bodo').notNull(),
  roman: text('roman').notNull().default(''),
  english: text('english').notNull(),
  source: text('source').notNull().default('dictionary'),
  slug: text('slug'),
  fts: tsvector('fts'),
});

export const contributors = pgTable('contributors', {
  id: uuid('id').primaryKey().defaultRandom(),
  display_name: text('display_name').notNull(),
  email: text('email').notNull().unique(),
  bio: text('bio'),
  approved: boolean('approved').notNull().default(false),
  approved_at: timestamp('approved_at', { withTimezone: true, mode: 'string' }),
  approved_by: uuid('approved_by'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
});

export const recordings = pgTable('recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  word_id: integer('word_id').notNull(),
  word_bodo: text('word_bodo').notNull(),
  word_roman: text('word_roman').notNull().default(''),
  contributor_id: uuid('contributor_id')
    .notNull()
    .references(() => contributors.id, { onDelete: 'cascade' }),
  storage_path: text('storage_path').notNull(),
  duration_ms: integer('duration_ms'),
  status: recording_status('status').notNull().default('pending'),
  reviewed_by: uuid('reviewed_by'),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true, mode: 'string' }),
  review_note: text('review_note'),
  created_at: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
});
