import { validateBody } from '../../utils/validate'
import { requireWriteActor } from '../../utils/write-auth'
import { bulkPagesSchema } from '../../utils/validations/content-bulk'
import { bulkPagesMutation } from '../../services/page-mutations'
import { defineEventHandler, readBody } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'pages')
  const data = validateBody(bulkPagesSchema, await readBody(event))
  return bulkPagesMutation(event, actor, data)
})
