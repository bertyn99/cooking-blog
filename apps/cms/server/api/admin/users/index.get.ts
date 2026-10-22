import { requireAdmin } from '../../../utils/http-auth'
import { parsePagination } from '../../../utils/pagination'
import { useStaffService } from '../../../services/staff-service'
import { defineEventHandler, getQuery } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { page, pageSize } = parsePagination(getQuery(event))
  return useStaffService(event).list(page, pageSize)
})
