import { updateMediaAccessibility } from '../../utils/media'
import { canEditContent } from '../../../shared/abilities'
import { useDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  await authorize(event, canEditContent)

  const body = await readBody<{
    pathname?: string
    originalName?: string
    altText?: string | null
    description?: string | null
  }>(event)

  if (!body?.pathname) {
    throw createError({ statusCode: 400, statusMessage: 'pathname is required' })
  }

  const hasRename = body.originalName !== undefined
  const hasAccessibility = body.altText !== undefined || body.description !== undefined

  if (!hasRename && !hasAccessibility) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  const db = useDb(event)

  return updateMediaAccessibility(event, db, body.pathname, {
    originalName: body.originalName,
    altText: body.altText,
    description: body.description,
  })
})
