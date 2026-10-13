import { validateBody } from '../../utils/validate'
import { requireWriteActor } from '../../utils/write-auth'
import { bulkContentSchema } from '../../utils/validations/content-bulk'
import { bulkContentMutation } from '../../services/content-bulk-mutations'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'articles')
  const data = validateBody(bulkContentSchema, await readBody(event))
  return bulkContentMutation(event, actor, 'articles', data)
})
