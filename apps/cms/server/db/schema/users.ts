import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  username: text('username'),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'editor', 'agent'] }).default('editor').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  deactivatedAt: text('deactivated_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})
