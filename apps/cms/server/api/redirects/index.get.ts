import { parsePagination } from '../../utils/pagination'
import { useQueries } from '../../utils/db'
import { requireEditor } from '../../utils/http-auth'
import { defineEventHandler, getQuery } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  await requireEditor(event)
  const pagination = parsePagination(getQuery(event) as Record<string, string>)
  return useQueries(event).redirects.listPage({ pagination })
})
