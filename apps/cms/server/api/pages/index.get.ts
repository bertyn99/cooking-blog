import { validateQuery } from '../../utils/validate'
import { parsePagination } from '../../utils/pagination'
import { PAGES_RELATIONS } from '../../db/queries/_shared/builders/pages'
import { useQueries } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { pages } = useQueries(event)

  const { include } = validateQuery(
    query as Record<string, string>,
    [...PAGES_RELATIONS],
  )
  const locale = (query.locale as string) || undefined
  const pagination = parsePagination(query as Record<string, string>)
  const session = await getUserSession(event)

  const slug = (query.slug as string) || undefined
  const parentSlug = (query.parentSlug as string) || undefined
  let parentId: number | undefined

  if (parentSlug) {
    const parent = await pages.findRowBySlug(parentSlug, locale)
    parentId = parent?.id
    if (!parentId) {
      return {
        data: [],
        meta: { pagination: { page: pagination.page, pageSize: pagination.pageSize, pageCount: 0, total: 0 } },
      }
    }
  }

  return pages.listPage({
    include,
    locale,
    filters: {
      slug: slug || undefined,
      parentId,
    },
    isAuthenticated: !!session.user,
    pagination,
  })
})
