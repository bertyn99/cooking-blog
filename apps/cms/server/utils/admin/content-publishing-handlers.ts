import type { H3Event } from 'h3'
import { createPublishingService } from '../../services/publishing-service'
import type { PublishableContentType } from '../content-types'
import { isPublishableContentType } from '../content-types'
import { createApiError } from '../errors'
import { useDb } from '../db'
import { canAccessAdminApi } from '../../../shared/abilities'

function parseContentId(event: H3Event): number {
  const id = Number.parseInt(getRouterParam(event, 'id') || '', 10)
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }
  return id
}

async function requireAdmin(event: H3Event) {
  await requireUserSession(event)
  await authorize(event, canAccessAdminApi)
}

export async function handleAdminPublish(event: H3Event, contentType: PublishableContentType) {
  await requireAdmin(event)
  const id = parseContentId(event)
  const db = useDb(event)
  return createPublishingService(db).publish(contentType, id)
}

export async function handleAdminSchedule(event: H3Event, contentType: PublishableContentType) {
  await requireAdmin(event)
  const id = parseContentId(event)
  const body = await readBody<{ scheduledAt?: string }>(event)
  if (!body?.scheduledAt) {
    throw createError({ statusCode: 400, statusMessage: 'scheduledAt is required' })
  }
  const db = useDb(event)
  return createPublishingService(db).schedule(contentType, id, body.scheduledAt)
}

export async function handleAdminUnpublish(event: H3Event, contentType: PublishableContentType) {
  await requireAdmin(event)
  const id = parseContentId(event)
  const db = useDb(event)
  return createPublishingService(db).unpublish(contentType, id)
}

function parseContentTypeParam(event: H3Event): PublishableContentType {
  const contentType = getRouterParam(event, 'contentType') || ''
  if (!isPublishableContentType(contentType)) {
    throw createApiError('VALIDATION_ERROR', `Unknown content type: ${contentType}`)
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
