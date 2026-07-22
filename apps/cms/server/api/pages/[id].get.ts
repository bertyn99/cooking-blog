import { parseInclude } from '../../utils/populate'
import { createApiError } from '../../utils/errors'
import { PAGES_RELATIONS } from '../../db/queries/_shared/builders/pages'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id < 1) {
    throw createApiError('VALIDATION_ERROR', 'Invalid page ID')
  }

  const query = getQuery(event)
  const includeList = parseInclude(query as Record<string, string>)

  if (!includeList.includes('*')) {
    const invalid = includeList.filter(
      r => !(PAGES_RELATIONS as readonly string[]).includes(r),
    )
    if (invalid.length) {
      throw createApiError('VALIDATION_ERROR', `Invalid includes: ${invalid.join(', ')}`)
    }
  }

  const session = await getUserSession(event)
  const scope = session.user ? 'admin' : 'public'
  const { pages } = useQueries(event)
  const page = await pages.findById(id, includeList, scope)

  if (!page) {
    throw createApiError('NOT_FOUND', 'Page not found')
  }

  return { data: page }
})
