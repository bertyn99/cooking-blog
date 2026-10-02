import { validateBody } from '../../utils/validate'
import { requireWriteActor } from '../../utils/write-auth'
import {
  createPageMutation,
  createPageSchema,
} from '../../services/page-mutations'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'pages')
  const body = validateBody(createPageSchema, await readBody(event))
  const page = await createPageMutation(event, actor, body)
  return { data: page }
})
