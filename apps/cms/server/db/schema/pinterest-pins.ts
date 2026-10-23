import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

/**
 * Pinterest pin pipeline — one row per (content, image) pair.
 *
 * Rules encoded here (see .agents/skills/jdc-pinterest/SKILL.md):
 * - fresh pins only: one image = at most one pin per destination,
 *   ≥72h between pins pointing at the same URL (`not_before`),
 * - `pending` rows are drained by the `pinterest-publish-due` task with a
 *   daily cap (3–10 pins/day account cadence),
 * - `error` rows keep the API message for observability.
 */
export const pinterestPins = sqliteTable('pinterest_pins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** 'articles' | 'recipes' */
  contentType: text('content_type').notNull(),
  contentId: integer('content_id').notNull(),
  /** Blob pathname (`uploads/…`) — also the dedupe key per content. */
  imagePath: text('image_path').notNull(),
  isCover: integer('is_cover', { mode: 'boolean' }).notNull().default(false),
  /** 'pending' | 'pinned' | 'error' */
  status: text('status').notNull().default('pending'),
  /** Earliest ISO instant the pin may be created (72h same-URL spacing). */
  notBefore: text('not_before').notNull(),
  pinId: text('pin_id'),
  boardId: text('board_id'),
  title: text('title'),
  description: text('description'),
  error: text('error'),
  createdAt: text('created_at').notNull(),
  pinnedAt: text('pinned_at'),
}, (table) => [
  uniqueIndex('pinterest_pins_content_image_uq').on(table.contentType, table.contentId, table.imagePath),
  index('pinterest_pins_due_idx').on(table.status, table.notBefore),
  index('pinterest_pins_content_idx').on(table.contentType, table.contentId),
])
