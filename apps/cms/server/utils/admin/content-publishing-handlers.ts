import type { H3Event } from 'nitro/h3'
import { usePublishingService } from '../../services/publishing-service'
import type { PublishableContentType } from '../content-types'
import { isPublishableContentType } from '../content-types'
import { createApiError } from '../errors'
import { requireAbility } from '../http-auth'
import { canPublishContent } from '../../../shared/abilities'

function parseContentId(event: H3Event): number {
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createApiError('VALIDATION_ERROR', 'Identifiant invalide.')
  }
  return id
}

export async function handleAdminPublish(event: H3Event, contentType: PublishableContentType) {
  const session = await requireAbility(event, canPublishContent)
  const id = parseContentId(event)
  return usePublishingService(event).publish(contentType, id, {
    actorUserId: session.user?.id,
  })
}

export async function handleAdminSchedule(event: H3Event, contentType: PublishableContentType) {
  await requireAbility(event, canPublishContent)
  const id = parseContentId(event)
  const body = await readBody<{ scheduledAt?: string, date?: string }>(event)
  const scheduledAt = body?.scheduledAt ?? body?.date
  if (!scheduledAt) {
    throw createApiError('VALIDATION_ERROR', 'scheduledAt est requis.')
  }
  return usePublishingService(event).schedule(contentType, id, scheduledAt)
}

export async function handleAdminUnpublish(event: H3Event, contentType: PublishableContentType) {
  await requireAbility(event, canPublishContent)
  const id = parseContentId(event)
  return usePublishingService(event).unpublish(contentType, id)
}

function parseContentTypeParam(event: H3Event): PublishableContentType {
  const contentType = getRouterParam(event, 'contentType') || ''
  if (!isPublishableContentType(contentType)) {
    throw createApiError('VALIDATION_ERROR', `Type de contenu inconnu : ${contentType}`)
  }
  return contentType
}

export async function handleAdminPublishFromParam(event: H3Event) {
  return handleAdminPublish(event, parseContentTypeParam(event))
}

export async function handleAdminScheduleFromParam(event: H3Event) {
  return handleAdminSchedule(event, parseContentTypeParam(event))
}

export async function handleAdminUnpublishFromParam(event: H3Event) {
  return handleAdminUnpublish(event, parseContentTypeParam(event))
}
