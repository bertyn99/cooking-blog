import { validateBody } from '../../utils/validate'
import { requireWriteActor } from '../../utils/write-auth'
import {
  createArticleMutation,
  createArticleSchema,
} from '../../services/article-mutations'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'articles')
  const data = validateBody(createArticleSchema, await readBody(event))
  const result = await createArticleMutation(event, actor, data)
  setResponseStatus(event, 201)
  return result
})
