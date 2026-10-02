import { validateBody } from '../../utils/validate'
import { createApiError } from '../../utils/errors'
import { requireWriteActor } from '../../utils/write-auth'
import {
  updateArticleMutation,
  updateArticleSchema,
} from '../../services/article-mutations'

export default defineEventHandler(async (event) => {
  const actor = await requireWriteActor(event, 'articles')

  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Article introuvable.')
  }

  const data = validateBody(updateArticleSchema, await readBody(event))
  return updateArticleMutation(event, actor, id, data)
})
