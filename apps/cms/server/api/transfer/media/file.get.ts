import { requireApiKey } from '../../../../utils/api-key-auth'
import { useQueries } from '../../../../utils/db'
import { createApiError } from '../../../../utils/errors'
import { useMediaStorage } from '../../../../utils/media-storage'
import { isAllowedMediaAssetPath } from '../../../../shared/image-delivery-policy'

export default defineEventHandler(async (event) => {
  await requireApiKey(event, 'media')
  const query = getQuery(event)
  const pathname = typeof query.pathname === 'string' ? query.pathname.trim().replace(/^\//, '') : ''
  if (!pathname || !isAllowedMediaAssetPath(pathname)) {
    throw createApiError('VALIDATION_ERROR', 'Chemin média invalide.')
  }

  const blob = await useQueries(event).transferExport.findBlob(pathname)
  if (!blob) {
    throw createApiError('NOT_FOUND', 'Média introuvable dans le catalogue.')
  }

  const stored = await useMediaStorage(event).get(pathname)
  if (!stored) {
    throw createApiError('NOT_FOUND', 'Fichier média manquant sur le stockage.')
  }

  const headers: Record<string, string> = {
    'Content-Type': stored.object.contentType || blob.mimeType || 'application/octet-stream',
    'Cache-Control': 'private, no-store',
  }
  if (stored.object.etag) {
    headers.ETag = stored.object.etag
  }

  return new Response(stored.body, { headers })
})
