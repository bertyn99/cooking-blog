import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { recipes } from './recipes'

export const nutrition = sqliteTable('nutrition', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recipeId: integer('recipe_id').notNull().unique().references(() => recipes.id, { onDelete: 'cascade' }),
  lipides: text('lipides'),
  proteine: text('proteine'),
  sucre: text('sucre'),
  calories: text('calories'),
  glucides: text('glucides'),
  sodium: text('sodium'),
})
