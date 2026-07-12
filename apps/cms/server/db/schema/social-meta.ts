import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { seo } from './seo'

export const socialMeta = sqliteTable('social_meta', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  seoId: integer('seo_id').notNull().references(() => seo.id, { onDelete: 'cascade' }),
  socialNetwork: text('social_network', { enum: ['Facebook', 'Twitter'] }),
  title: text('title'),
  description: text('description'),
  imageBlobPathname: text('image_blob_pathname'),
}, (table) => [
  index('idx_social_meta_seo_id').on(table.seoId),
])
