import { createArticleQueries } from '../../db/queries/articles'
import { parseInclude } from '../../utils/populate'
import { createApiError } from '../../utils/errors'
import { useDb } from '../../utils/db'
import { serializeArticleForScope } from '../../utils/serialize-content'

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Article not found')
  }

  const query = getQuery(event)
  const include = parseInclude(query as Record<string, unknown>)
  const db = useDb(event)
  const session = await getUserSession(event)
  const scope = session.user ? 'admin' : 'public'
  const article = await createArticleQueries(db).findById(id, include, scope)

  if (!article) {
    throw createApiError('NOT_FOUND', 'Article not found')
  }

  return serializeArticleForScope(article, scope)
})
