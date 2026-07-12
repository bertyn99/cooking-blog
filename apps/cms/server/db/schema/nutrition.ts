import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const nutrition = sqliteTable('nutrition', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().unique(),
  lipides: text('lipides'),
  proteine: text('proteine'),
  sucre: text('sucre'),
  calories: text('calories'),
  glucides: text('glucides'),
  sodium: text('sodium'),
})
