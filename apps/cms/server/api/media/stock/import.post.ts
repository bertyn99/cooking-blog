import { z } from 'zod'
import { downloadPexelsPhoto, getPexelsPhotoById } from '../../../services/stock/pexels'
import { getClientIp } from '../../../utils/client-ip'
import { createApiError } from '../../../utils/errors'
import { requireEditor } from '../../../utils/http-auth'
import { ingestImageBuffer } from '../../../utils/ingest-image-buffer'
import { useKvStore } from '../../../utils/kv'
import { createRequestRateLimiter } from '../../../utils/rate-limit'

const STOCK_IMPORT_LIMIT = {
  prefix: 'media-stock-import',
  maxRequests: 30,
  windowSeconds: 60,
} as const

const bodySchema = z.object({
  provider: z.literal('pexels'),
  id: z.string().min(1),
  preferredSize: z.enum(['original', 'large']).optional(),
})

function getStockImportLimiter(event: Parameters<typeof useKvStore>[0]) {
  return createRequestRateLimiter(useKvStore(event), STOCK_IMPORT_LIMIT)
}

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Corps de requête invalide.', parsed.error.flatten())
  }

  const limiter = getStockImportLimiter(event)
  const rateKey = `${session.user.id}:${getClientIp(event)}`
  const rate = await limiter.consume(rateKey)
  if (!rate.allowed) {
    throw createApiError(
      'FORBIDDEN',
      'Trop d’imports. Réessayez dans quelques instants.',
      { retryAfterSeconds: STOCK_IMPORT_LIMIT.windowSeconds },
    )
  }

  const data = parsed.data
  const photo = await getPexelsPhotoById(data.id)
  const { buffer, contentType } = await downloadPexelsPhoto(
    photo,
    data.preferredSize ?? 'large',
  )

  const altText = photo.alt || (photo.photographer ? `Photo de ${photo.photographer}` : undefined)

  const ingested = await ingestImageBuffer(event, {
    buffer,
    contentType,
    originalName: `pexels-${data.id}.webp`,
    altText,
    source: 'pexels',
    stockProvider: 'pexels',
    stockExternalId: data.id,
    attribution: {
      photographer: photo.photographer,
      photographerUrl: photo.photographerUrl,
      sourceUrl: photo.pageUrl,
      sourceName: 'Pexels',
    },
  })

  setResponseStatus(event, ingested.duplicate ? 200 : 201)
  return ingested
})
