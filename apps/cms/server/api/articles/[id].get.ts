import { parseInclude } from '../../utils/populate'
import { createApiError } from '../../utils/errors'
import { useQueries } from '../../utils/db'
import { serializeArticleForScope } from '../../utils/serialize-content'

export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Article not found')
  }

  const query = getQuery(event)
  const include = parseInclude(query as Record<string, unknown>)
  const session = await getUserSession(event)
  const scope = session.user ? 'admin' : 'public'
  const { articles } = useQueries(event)
  const article = await articles.findById(id, include, scope)

  if (!article) {
    throw createApiError('NOT_FOUND', 'Article not found')
  }

  return serializeArticleForScope(article, scope)
})
