import { z } from 'zod'
import { searchPexels, type StockOrientation } from '../../../services/stock/pexels'
import { getClientIp } from '../../../utils/client-ip'
import { createApiError } from '../../../utils/errors'
import { requireEditor } from '../../../utils/http-auth'
import { useKvStore } from '../../../utils/kv'
import { createRequestRateLimiter } from '../../../utils/rate-limit'

const STOCK_SEARCH_LIMIT = {
  prefix: 'media-stock-search',
  maxRequests: 60,
  windowSeconds: 60,
} as const

const querySchema = z.object({
  q: z.string().trim().min(1).max(200),
  page: z.coerce.number().int().min(1).max(100).optional(),
  per_page: z.coerce.number().int().min(1).max(40).optional(),
  orientation: z.enum(['landscape', 'portrait', 'square']).optional(),
  locale: z.string().max(16).optional(),
})

function getStockSearchLimiter(event: Parameters<typeof useKvStore>[0]) {
  return createRequestRateLimiter(useKvStore(event), STOCK_SEARCH_LIMIT)
}

export default defineEventHandler(async (event) => {
  const session = await requireEditor(event)
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createApiError('VALIDATION_ERROR', 'Requête de recherche invalide.', parsed.error.flatten())
  }

  const limiter = getStockSearchLimiter(event)
  const rateKey = `${session.user.id}:${getClientIp(event)}`
  const rate = await limiter.consume(rateKey)
  if (!rate.allowed) {
    throw createApiError(
      'FORBIDDEN',
      'Trop de recherches. Réessayez dans quelques instants.',
      { retryAfterSeconds: STOCK_SEARCH_LIMIT.windowSeconds },
    )
  }

  const { q, page, per_page, orientation, locale } = parsed.data

  return searchPexels({
    query: q,
    page,
    perPage: per_page,
    orientation: orientation as StockOrientation | undefined,
    locale,
  })
})
