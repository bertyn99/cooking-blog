import { canPublishContent } from '../../../../../shared/abilities'
import { requireAbility } from '../../../../utils/http-auth'
import { useQueries } from '../../../../utils/db'
import { createApiError } from '../../../../utils/errors'
import { syncGlossaryRobotsForStatus } from '../../../../services/glossary-mutations'
import { defineEventHandler, getRouterParam } from 'nuxt/server'

export default defineEventHandler(async (event) => {
  await requireAbility(event, canPublishContent)
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('VALIDATION_ERROR', 'Identifiant invalide.')
  }

  const { glossary } = useQueries(event)
  const existing = await glossary.findRowById(id)
  if (!existing) {
    throw createApiError('NOT_FOUND', 'Terme de glossaire introuvable.')
  }

  const now = new Date().toISOString()
  await glossary.updateById(id, {
    status: 'published',
    publishedAt: existing.publishedAt ?? now,
    updatedAt: now,
  })
  await syncGlossaryRobotsForStatus(event, id, 'published')

  return { status: 'published' as const, publishedAt: existing.publishedAt ?? now }
})
