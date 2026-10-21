import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'
import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { sendNoContent } from 'h3'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = parseInt(getRouterParam(event, 'id') || '')
  if (isNaN(id)) throw createError({ statusCode: 404 })

  await useQueries(event).articles.softDelete(id)

  return sendNoContent(event)
})
