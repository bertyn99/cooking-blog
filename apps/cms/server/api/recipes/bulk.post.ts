import { validateBody } from '../../utils/validate'
import { requireWriteActor } from '../../utils/write-auth'
import { bulkContentSchema } from '../../utils/validations/content-bulk'
import { bulkContentMutation } from '../../services/content-bulk-mutations'
import { defineEventHandler, readBody } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'recipes')
  const data = validateBody(bulkContentSchema, await readBody(event))
  return bulkContentMutation(event, actor, 'recipes', data)
})
