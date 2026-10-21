import { canEditContent } from '../../../shared/abilities'
import { useQueries } from '../../utils/db'
import { createApiError } from '../../utils/errors'
import { defineEventHandler, getRouterParam } from 'nuxt/server'
import { sendNoContent } from 'h3'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('NOT_FOUND', 'Terme de glossaire introuvable.')
  }

  const { glossary } = useQueries(event)
  const existing = await glossary.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Terme de glossaire introuvable.')
  }

  await glossary.softDelete(id)
  return sendNoContent(event)
})
